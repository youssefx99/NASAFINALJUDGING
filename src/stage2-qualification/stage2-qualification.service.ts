import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Panel } from '../schemas/panel.schema';
import { Score } from '../schemas/score.schema';
import { Team } from '../schemas/team.schema';
import { User } from '../schemas/user.schema';

@Injectable()
export class Stage2QualificationService {
  constructor(
    @InjectModel(Panel.name) private panelModel: Model<Panel>,
    @InjectModel(Score.name) private scoreModel: Model<Score>,
    @InjectModel(Team.name) private teamModel: Model<Team>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async getQualificationStats() {
    // Get all Stage 1 panels
    const stage1Panels = await this.panelModel
      .find({ stage: 1 })
      .populate('judges')
      .populate('teams')
      .exec();

    let incompleteTeamsCount = 0;
    let readyTeamsCount = 0;
    const allStage1Teams = new Set<string>();
    const processedTeams = new Set<string>(); // Track already processed teams

    // Check each team in each panel
    for (const panel of stage1Panels) {
      const judgeIds = (panel.judges as any[]).map((j) =>
        typeof j === 'string' ? j : j._id.toString(),
      );
      const teamIds = (panel.teams as any[]).map((t) =>
        typeof t === 'string' ? t : t._id.toString(),
      );

      for (const teamId of teamIds) {
        allStage1Teams.add(teamId);

        // Skip if already processed (team in multiple panels)
        if (processedTeams.has(teamId)) {
          continue;
        }
        processedTeams.add(teamId);

        // Get all scores for this team in Stage 1
        const scores = await this.scoreModel
          .find({ team: teamId, stage: 1 })
          .exec();

        const scoredByJudges = scores.map((s) => s.judge.toString());

        // Check if ALL judges in the panel scored this team
        const allJudgesScored = judgeIds.every((judgeId) =>
          scoredByJudges.includes(judgeId),
        );

        if (allJudgesScored) {
          readyTeamsCount++;
        } else {
          incompleteTeamsCount++;
        }
      }
    }

    // Get incomplete judges
    const incompleteJudgesData = await this.getIncompleteJudges();

    // Get top teams preview (default 60, show first 10)
    const topTeamsPreview = await this.getTopTeamsForQualification(60);

    return {
      incompleteTeams: incompleteTeamsCount,
      incompleteJudges: incompleteJudgesData.pagination.totalItems,
      readyTeams: readyTeamsCount,
      totalStage1Teams: allStage1Teams.size,
      topTeamsPreview: topTeamsPreview.slice(0, 10), // Show first 10 as preview
    };
  }

  async getIncompleteJudges(page: number = 1, limit: number = 10) {
    // Get all Stage 1 judges (users with role 'judge' assigned to Stage 1 panels)
    const stage1Panels = await this.panelModel
      .find({ stage: 1 })
      .populate('judges')
      .populate('teams')
      .exec();

    const judgeMap = new Map<
      string,
      { judge: any; assignedTeams: Set<string> }
    >();

    // Build map of judges and their assigned teams
    for (const panel of stage1Panels) {
      const judges = panel.judges as any[];
      const teams = panel.teams as any[];

      for (const judge of judges) {
        const judgeId =
          typeof judge === 'string' ? judge : judge._id.toString();
        if (!judgeMap.has(judgeId)) {
          judgeMap.set(judgeId, {
            judge: judge,
            assignedTeams: new Set(),
          });
        }
        for (const team of teams) {
          const teamId = typeof team === 'string' ? team : team._id.toString();
          judgeMap.get(judgeId)?.assignedTeams.add(teamId);
        }
      }
    }

    const incompleteJudges: Array<{
      judgeId: string;
      judgeName: string;
      assignedTeams: number;
      scoredTeams: number;
      pendingTeams: number;
    }> = [];

    // Check each judge's completion status
    for (const [judgeId, data] of judgeMap.entries()) {
      const assignedTeamIds = Array.from(data.assignedTeams);
      const scores = await this.scoreModel
        .find({ judge: judgeId, stage: 1 })
        .exec();

      const scoredTeamIds = scores.map((s) => s.team.toString());
      const pendingTeams = assignedTeamIds.filter(
        (teamId) => !scoredTeamIds.includes(teamId),
      );

      if (pendingTeams.length > 0) {
        const judgeData =
          typeof data.judge === 'string'
            ? await this.userModel.findById(data.judge).exec()
            : data.judge;

        incompleteJudges.push({
          judgeId: judgeId,
          judgeName: judgeData?.name || 'Unknown',
          assignedTeams: assignedTeamIds.length,
          scoredTeams: scoredTeamIds.length,
          pendingTeams: pendingTeams.length,
        });
      }
    }

    // Apply pagination
    const total = incompleteJudges.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedJudges = incompleteJudges.slice(startIndex, endIndex);

    return {
      judges: paginatedJudges,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async getTopTeamsForQualification(limit: number = 60) {
    // Get top teams by Stage 1 average score
    const scores = await this.scoreModel
      .aggregate([
        { $match: { stage: 1 } },
        {
          $group: {
            _id: '$team',
            averageScore: { $avg: '$totalScore' },
            judgeCount: { $sum: 1 },
          },
        },
        { $sort: { averageScore: -1 } },
        { $limit: limit },
      ])
      .exec();

    // Populate team details
    const teamIds = scores.map((s) => s._id);
    const teams = await this.teamModel.find({ _id: { $in: teamIds } }).exec();

    return scores.map((score) => {
      const team = teams.find(
        (t) => (t as any)._id.toString() === score._id.toString(),
      );
      return {
        _id: score._id,
        name: team?.name || 'Unknown',
        challenge: team?.challenge || 'Unknown',
        averageScore: score.averageScore,
        judgeCount: score.judgeCount,
      };
    });
  }

  async qualifyTopTeams(limit: number = 60) {
    // VALIDATION: Check limit is valid
    if (!limit || limit < 1 || limit > 500) {
      throw new Error(`Invalid limit: ${limit}. Must be between 1 and 500.`);
    }

    console.log(
      `[QUALIFICATION] Starting qualification process for top ${limit} teams`,
    );

    // Get top N teams
    const topTeams = await this.getTopTeamsForQualification(limit);

    if (topTeams.length === 0) {
      throw new Error('No teams found with Stage 1 scores');
    }

    const topTeamIds = topTeams.map((t) => t._id.toString());

    console.log(`[QUALIFICATION] Found ${topTeamIds.length} teams to qualify`);
    console.log(
      `[QUALIFICATION] Team IDs: ${topTeamIds.slice(0, 5).join(', ')}...`,
    );

    // Get all Stage 2 panels
    const stage2Panels = await this.panelModel.find({ stage: 2 }).exec();

    if (stage2Panels.length === 0) {
      throw new Error(
        'No Stage 2 panels found. Please create Stage 2 panels first.',
      );
    }

    console.log(
      `[QUALIFICATION] Found ${stage2Panels.length} Stage 2 panels to update`,
    );

    // SAFETY: Store original panel data for rollback
    const originalPanelData = stage2Panels.map((panel) => ({
      id: (panel as any)._id,
      teams: panel.teams,
    }));

    let updatedCount = 0;

    try {
      // Update each Stage 2 panel with all top N teams
      for (const panel of stage2Panels) {
        const result = await this.panelModel
          .findByIdAndUpdate(
            (panel as any)._id,
            { teams: topTeamIds },
            { new: true }, // Return updated document
          )
          .exec();

        if (!result) {
          throw new Error(`Failed to update panel: ${panel.name}`);
        }

        updatedCount++;
        console.log(
          `[QUALIFICATION] Updated panel: ${panel.name} (${updatedCount}/${stage2Panels.length})`,
        );
      }

      console.log(
        `[QUALIFICATION] ✅ Successfully qualified ${topTeamIds.length} teams to ${updatedCount} panels`,
      );

      return {
        success: true,
        qualifiedTeams: topTeamIds.length,
        updatedPanels: updatedCount,
        teamIds: topTeamIds,
      };
    } catch (error) {
      // ROLLBACK: Restore original panel data if something failed
      console.error(
        `[QUALIFICATION] ❌ Error during qualification: ${error.message}`,
      );
      console.log(`[QUALIFICATION] Rolling back changes...`);

      for (const original of originalPanelData) {
        try {
          await this.panelModel
            .findByIdAndUpdate(original.id, { teams: original.teams })
            .exec();
        } catch (rollbackError) {
          console.error(
            `[QUALIFICATION] Failed to rollback panel ${original.id}: ${rollbackError.message}`,
          );
        }
      }

      throw new Error(
        `Qualification failed and was rolled back: ${error.message}`,
      );
    }
  }
}
