import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Panel, PanelDocument } from '../schemas/panel.schema';
import { Team, TeamDocument } from '../schemas/team.schema';
import { Score, ScoreDocument } from '../schemas/score.schema';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class JudgesService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Panel.name) private panelModel: Model<PanelDocument>,
    @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
    @InjectModel(Score.name) private scoreModel: Model<ScoreDocument>,
  ) {}

  async getAssignedTeams(judgeId: string) {
    const [judge, assignedPanels, scores] = await Promise.all([
      this.userModel.findById(judgeId, { role: 1 }).lean().exec(),
      this.panelModel
        .find({ judges: judgeId }, { stage: 1, teams: 1, awardType: 1 })
        .lean()
        .exec(),
      this.scoreModel
        .find({ judge: judgeId }, { team: 1, stage: 1 })
        .lean()
        .exec(),
    ]);
    if (!judge || judge.role !== 'judge') {
      throw new Error('Judge not found');
    }

    // Separate panels by stage
    const stage1TeamIds: any[] = [];
    const stage2TeamIds: any[] = [];
    let stage2AwardType: string | undefined;

    for (const panel of assignedPanels) {
      if (panel.stage === 1) {
        stage1TeamIds.push(...(panel.teams || []));
      } else if (panel.stage === 2) {
        stage2TeamIds.push(...(panel.teams || []));
        stage2AwardType = panel.awardType; // Added: Get award type for Stage 2
      }
    }

    const [stage1TeamsDetails, stage2TeamsDetails] = await Promise.all([
      stage1TeamIds.length > 0
        ? this.teamModel.find({ _id: { $in: stage1TeamIds } }).lean().exec()
        : [],
      stage2TeamIds.length > 0
        ? this.teamModel.find({ _id: { $in: stage2TeamIds } }).lean().exec()
        : [],
    ]);

    return {
      stage1Teams: stage1TeamsDetails,
      stage2Teams: stage2TeamsDetails,
      stage2AwardType: stage2AwardType, // Added: Return award type
      stage1ScoredTeamIds: scores
        .filter((score) => score.stage === 1)
        .map((score) => String(score.team)),
      stage2ScoredTeamIds: scores
        .filter((score) => score.stage === 2)
        .map((score) => String(score.team)),
    };
  }

  async processCsvFile(buffer: Buffer) {
    const csvContent = buffer.toString('utf-8');
    const lines = csvContent.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one data row');
    }

    // Parse header row
    const header = this.parseCsvRow(lines[0]);

    // Expected columns: Title, Name, Last time judged in NSAC, Email, LinkedIn, Phone, Judging Area, Reached Out by Call, Response Status, Confirmed, Filled the Form
    const expectedColumns = [
      'Title',
      'Name',
      'Last time judged in NSAC',
      'Email',
      'LinkedIn',
      'Phone',
      'Judging Area',
      'Reached Out by Call',
      'Response Status',
      'Confirmed',
      'Filled the Form',
    ];

    // Validate header
    const missingColumns = expectedColumns.filter(
      (col) => !header.includes(col),
    );
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    const judges: any[] = [];
    const errors: string[] = [];

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      try {
        const row = this.parseCsvRow(lines[i]);
        if (row.length !== header.length) {
          errors.push(`Row ${i + 1}: Column count mismatch`);
          continue;
        }

        const judgeData: any = {};
        header.forEach((col, index) => {
          judgeData[col] = row[index] || '';
        });

        // Map CSV columns to judge schema fields
        const name = String(judgeData.Name || '').trim();

        if (!name) {
          errors.push(`Row ${i + 1}: Missing required field (Name)`);
          continue;
        }

        // Generate email from name (lowercase with underscores)
        const finalEmail = `${name.toLowerCase().replace(/\s+/g, '_')}@judge.com`;

        // Random password, returned once in the upload response so the admin can share it
        const password = randomBytes(9).toString('base64url');

        const judge = {
          name: name,
          email: finalEmail,
          password: password,
          role: 'judge',
          panelAssignments: [],
        };

        judges.push(judge);
      } catch (error: any) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    if (errors.length > 0 && judges.length === 0) {
      throw new Error(`CSV processing failed: ${errors.join('; ')}`);
    }

    // Save judges to database (skip emails that already exist)
    const existingEmails = new Set(
      (
        await this.userModel
          .find({ email: { $in: judges.map((judge) => judge.email) } }, { email: 1 })
          .lean()
          .exec()
      ).map((user) => user.email),
    );
    const newJudges = judges.filter((judge) => {
      if (existingEmails.has(judge.email)) {
        errors.push(`Judge with email ${judge.email} already exists`);
        return false;
      }
      return true;
    });
    const judgesToInsert = await Promise.all(
      newJudges.map(async ({ password, ...judge }) => ({
        ...judge,
        passwordHash: await bcrypt.hash(password, 10),
      })),
    );

    let savedJudges: UserDocument[] = [];
    try {
      savedJudges = await this.userModel.insertMany(judgesToInsert, {
        ordered: false,
      });
    } catch (error: any) {
      savedJudges = error.insertedDocs || [];
      for (const writeError of error.writeErrors || [error]) {
        errors.push(
          `Failed to save judge ${judgesToInsert[writeError.index]?.name ?? ''}: ${writeError.errmsg || writeError.message}`,
        );
      }
    }

    const passwordByEmail = new Map(newJudges.map((judge) => [judge.email, judge.password]));
    return {
      count: savedJudges.length,
      credentials: savedJudges.map((judge) => ({
        name: judge.name,
        email: judge.email,
        password: passwordByEmail.get(judge.email),
      })),
      judges: savedJudges.map((judge) => ({
        _id: judge._id,
        name: judge.name,
        email: judge.email,
        role: judge.role,
      })),
      errors: errors,
    };
  }

  private parseCsvRow(row: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];

      if (char === '"') {
        if (inQuotes && row[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }
}
