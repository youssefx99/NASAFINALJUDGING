import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Panel, PanelDocument } from '../schemas/panel.schema';
import { Team, TeamDocument } from '../schemas/team.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class JudgesService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Panel.name) private panelModel: Model<PanelDocument>,
    @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
  ) {}

  async getAssignedTeams(judgeId: string) {
    // Find the judge
    const judge = await this.userModel.findById(judgeId).exec();
    if (!judge || judge.role !== 'judge') {
      throw new Error('Judge not found');
    }

    // Get panels assigned to this judge and populate teams
    const assignedPanels = await this.panelModel
      .find({
        judges: judgeId,
      })
      .populate('teams')
      .exec();

    // Separate panels by stage
    const stage1Teams: any[] = [];
    const stage2Teams: any[] = [];
    let stage2AwardType: string | undefined;

    for (const panel of assignedPanels) {
      // Handle both number and ObjectId stage values
      const stageValue = panel.stage as any;
      if (stageValue === 1) {
        stage1Teams.push(...(panel.teams || []));
      } else if (stageValue === 2) {
        stage2Teams.push(...(panel.teams || []));
        stage2AwardType = panel.awardType; // Added: Get award type for Stage 2
      }
    }

    // Get full team details if teams are not already populated
    const stage1TeamIds = stage1Teams.map((team: any) =>
      typeof team === 'object' ? team._id : team,
    );
    const stage2TeamIds = stage2Teams.map((team: any) =>
      typeof team === 'object' ? team._id : team,
    );

    const stage1TeamsDetails =
      stage1TeamIds.length > 0
        ? await this.teamModel.find({ _id: { $in: stage1TeamIds } }).exec()
        : [];

    const stage2TeamsDetails =
      stage2TeamIds.length > 0
        ? await this.teamModel.find({ _id: { $in: stage2TeamIds } }).exec()
        : [];

    return {
      stage1Teams: stage1TeamsDetails,
      stage2Teams: stage2TeamsDetails,
      stage2AwardType: stage2AwardType, // Added: Return award type
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

        // Generate password: counter + first name (starting from 1)
        const firstName = name.split(' ')[0]; // Get first name
        const password = `${i}${firstName}`; // Counter starts from 1 (i is 1-based for data rows)
        const passwordHash = await bcrypt.hash(password, 10);

        const judge = {
          name: name,
          email: finalEmail,
          passwordHash: passwordHash,
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

    // Save judges to database
    const savedJudges: UserDocument[] = [];
    for (const judgeData of judges) {
      try {
        // Check if judge already exists
        const existingJudge = await this.userModel
          .findOne({ email: judgeData.email })
          .exec();
        if (existingJudge) {
          errors.push(`Judge with email ${judgeData.email} already exists`);
          continue;
        }

        const newJudge = new this.userModel(judgeData);
        const savedJudge = await newJudge.save();
        savedJudges.push(savedJudge);
      } catch (error: any) {
        errors.push(`Failed to save judge ${judgeData.name}: ${error.message}`);
      }
    }

    return {
      count: savedJudges.length,
      judges: savedJudges,
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
