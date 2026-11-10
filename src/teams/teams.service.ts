import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Team, TeamDocument } from '../schemas/team.schema';
import { Score, ScoreDocument } from '../schemas/score.schema';
import { Panel, PanelDocument } from '../schemas/panel.schema';

@Injectable()
export class TeamsService {
  constructor(
    @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
    @InjectModel(Score.name) private scoreModel: Model<ScoreDocument>,
    @InjectModel(Panel.name) private panelModel: Model<PanelDocument>,
  ) {}

  /**
   * Upsert teams (by name) from spreadsheet rows. Column headers are matched
   * case-insensitively with spaces/dashes treated as underscores ("Team Name" -> team_name).
   * rowNumbers are the spreadsheet row numbers used in error messages.
   */
  async importTeams(rows: Record<string, unknown>[], rowNumbers: number[] = []) {
    const errors: string[] = [];
    const teamsByName = new Map<string, { rowNumber: number; team: any }>();

    rows.forEach((raw, index) => {
      const rowNumber = rowNumbers[index] ?? index + 2;
      const row: Record<string, string> = {};
      for (const [key, value] of Object.entries(raw || {})) {
        row[key.trim().toLowerCase().replace(/[\s-]+/g, '_')] = String(
          value ?? '',
        ).trim();
      }

      const name = row.team_name;
      const challenge = row.challenge;
      if (!name || !challenge) {
        errors.push(
          `Row ${rowNumber}: Missing required fields (team_name: "${name || ''}", challenge: "${challenge || ''}")`,
        );
        return;
      }

      teamsByName.set(name, {
        rowNumber,
        team: {
          name,
          challenge,
          leaderName: name,
          leaderEmail: `${name.toLowerCase().replace(/[^a-z0-9]/g, '') || `team${rowNumber}`}@example.com`,
          demoLink: row.demo_link || '',
          proposalLink: row.proposal_link || '',
          projectLink: row.project_link || '',
          nasaSubmitLink: row.nasa_submit_link || '',
          panelNumber: row.panel_number || '',
          subjects: (row.subjects || '')
            .split(',')
            .map((subject) => subject.trim())
            .filter((subject) => subject.length > 0),
          actualSolution: row.actualsolution || row.actual_solution || '',
          qualifiedForStage2: false,
        },
      });
    });

    const entries = [...teamsByName.values()];
    let created = 0;
    let updated = 0;
    if (entries.length > 0) {
      try {
        const result = await this.teamModel.bulkWrite(
          entries.map(({ team }) => ({
            updateOne: {
              filter: { name: team.name },
              update: { $set: team },
              upsert: true,
            },
          })),
          { ordered: false },
        );
        created = result.upsertedCount;
        updated = result.matchedCount;
      } catch (error: any) {
        if (!error.result) throw error;
        created = error.result.upsertedCount;
        updated = error.result.matchedCount;
        for (const writeError of error.writeErrors || [error]) {
          const entry = entries[writeError.index];
          errors.push(
            `Row ${entry?.rowNumber ?? '?'}: Failed to save team "${entry?.team.name ?? ''}" - ${writeError.errmsg || writeError.message}`,
          );
        }
      }
    }

    return {
      received: rows.length,
      created,
      updated,
      duplicates: rows.length - errors.length - entries.length,
      failed: errors.length,
      errors,
    };
  }

  async getTeamsCount(): Promise<number> {
    return await this.teamModel.countDocuments();
  }

  // List view fields only; full team details come from getTeamById
  async getAllTeams(): Promise<Team[]> {
    return await this.teamModel
      .find(
        {},
        {
          name: 1,
          challenge: 1,
          actualSolution: 1,
          leaderName: 1,
          leaderEmail: 1,
          panelNumber: 1,
        },
      )
      .lean()
      .exec();
  }

  async isAssignedToJudge(teamId: string, judgeId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(teamId)) return false;
    return !!(await this.panelModel.exists({ judges: judgeId, teams: teamId }).exec());
  }

  async getTeamById(id: string): Promise<Team | null> {
    return await this.teamModel.findById(id).lean().exec();
  }

  async deleteTeam(id: string): Promise<void> {
    const team = await this.teamModel.findById(id);
    if (!team) {
      throw new Error('Team not found');
    }

    // Delete all scores and panel references associated with this team
    await Promise.all([
      this.scoreModel.deleteMany({ team: id }),
      this.panelModel.updateMany({ teams: id }, { $pull: { teams: id } }),
    ]);

    // Delete the team
    await this.teamModel.findByIdAndDelete(id);
  }

  async deleteAllTeams(): Promise<{ deletedCount: number }> {
    try {
      // Delete all scores and panel team lists first
      await Promise.all([
        this.scoreModel.deleteMany({}),
        this.panelModel.updateMany({}, { teams: [] }),
      ]);

      // Delete all teams
      const result = await this.teamModel.deleteMany({});

      return { deletedCount: result.deletedCount || 0 };
    } catch (error) {
      throw new Error(`Failed to delete all teams: ${error.message}`);
    }
  }

  /**
   * Get top teams from a specific stage
   */
  async getTopTeams(stage: number, limit: number) {
    const teams = await this.teamModel.find().exec();
    const teamScores: Array<{ team: TeamDocument; averageScore: number }> = [];

    for (const team of teams) {
      const scores = await this.scoreModel
        .find({
          team: team._id,
          stage: stage,
        })
        .exec();

      if (scores.length > 0) {
        const avgScore =
          scores.reduce((sum, s) => sum + s.totalScore, 0) / scores.length;
        teamScores.push({
          team,
          averageScore: avgScore,
        });
      }
    }

    teamScores.sort((a, b) => b.averageScore - a.averageScore);
    return teamScores.slice(0, limit).map((ts) => ts.team);
  }

  /**
   * Get top 60 teams from Stage 1 for Stage 2 qualification
   */
  async getTop60TeamsFromStage1() {
    const topTeams = await this.getTopTeams(1, 60);
    return topTeams;
  }

  /**
   * Get final rankings with 70/30 formula
   */
  async getFinalRankings(limit: number) {
    const allTeams = await this.teamModel.find().exec();
    const finalRankings: Array<{
      _id: any;
      name: string;
      challenge: string;
      stage1Score: number;
      stage2Score: number;
      finalScore: number;
    }> = [];

    for (const team of allTeams) {
      const stage1Scores = await this.scoreModel
        .find({
          team: team._id,
          stage: 1,
        })
        .exec();

      let stage1Avg = 0;
      if (stage1Scores.length > 0) {
        const stage1Total = stage1Scores.reduce(
          (sum, s) => sum + s.totalScore,
          0,
        );
        stage1Avg = stage1Total / stage1Scores.length;
      }

      const stage2Scores = await this.scoreModel
        .find({
          team: team._id,
          stage: 2,
        })
        .exec();

      let stage2Avg = 0;
      if (stage2Scores.length > 0) {
        const stage2Total = stage2Scores.reduce(
          (sum, s) => sum + s.totalScore,
          0,
        );
        stage2Avg = stage2Total / stage2Scores.length;
      }

      if (stage1Avg > 0 && stage2Avg > 0) {
        const stage1Percent = (stage1Avg / 25) * 100;
        const stage2Percent = (stage2Avg / 5) * 100;
        const finalScore = stage1Percent * 0.6 + stage2Percent * 0.4;

        finalRankings.push({
          _id: team._id,
          name: team.name,
          challenge: team.challenge,
          stage1Score: stage1Percent,
          stage2Score: stage2Percent,
          finalScore: finalScore,
        });
      }
    }

    finalRankings.sort((a, b) => b.finalScore - a.finalScore);
    return finalRankings.slice(0, limit);
  }
}
