import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Panel } from '../schemas/panel.schema';
import { Score } from '../schemas/score.schema';
import { Team } from '../schemas/team.schema';

@Injectable()
export class Stage2QualificationService {
  constructor(
    @InjectModel(Panel.name) private panelModel: Model<Panel>,
    @InjectModel(Score.name) private scoreModel: Model<Score>,
    @InjectModel(Team.name) private teamModel: Model<Team>,
  ) {}

  async getQualificationStats() {
    const [stage1Panels, judgesByTeam, incompleteJudgesData, topTeamsPreview] =
      await Promise.all([
        this.panelModel.find({ stage: 1 }, { judges: 1, teams: 1 }).lean().exec(),
        this.scoreModel
          .aggregate([
            { $match: { stage: 1 } },
            { $group: { _id: '$team', judges: { $addToSet: '$judge' } } },
          ])
          .exec(),
        this.getIncompleteJudges(),
        this.getTopTeamsForQualification(60),
      ]);

    const scoredBy = new Map(
      judgesByTeam.map((group) => [
        String(group._id),
        new Set(group.judges.map(String)),
      ]),
    );

    let incompleteTeamsCount = 0;
    let readyTeamsCount = 0;
    const processedTeams = new Set<string>(); // Team in multiple panels is checked against its first panel

    for (const panel of stage1Panels) {
      for (const teamId of panel.teams.map(String)) {
        if (processedTeams.has(teamId)) continue;
        processedTeams.add(teamId);

        // Check if ALL judges in the panel scored this team
        const scoredByJudges = scoredBy.get(teamId);
        if (panel.judges.every((judgeId) => scoredByJudges?.has(String(judgeId)))) {
          readyTeamsCount++;
        } else {
          incompleteTeamsCount++;
        }
      }
    }

    return {
      incompleteTeams: incompleteTeamsCount,
      incompleteJudges: incompleteJudgesData.pagination.totalItems,
      readyTeams: readyTeamsCount,
      totalStage1Teams: processedTeams.size,
      topTeamsPreview: topTeamsPreview.slice(0, 10), // Show first 10 as preview
    };
  }

  async getIncompleteJudges(page: number = 1, limit: number = 10) {
    const [stage1Panels, teamsByJudge] = await Promise.all([
      this.panelModel
        .find({ stage: 1 }, { judges: 1, teams: 1 })
        .populate('judges', 'name')
        .lean()
        .exec(),
      this.scoreModel
        .aggregate([
          { $match: { stage: 1 } },
          { $group: { _id: '$judge', teams: { $push: '$team' } } },
        ])
        .exec(),
    ]);

    const scoredTeamsByJudge = new Map(
      teamsByJudge.map((group) => [
        String(group._id),
        group.teams.map(String) as string[],
      ]),
    );

    // Build map of judges and their assigned teams (across all their Stage 1 panels)
    const judgeMap = new Map<
      string,
      { judgeName: string; assignedTeams: Set<string> }
    >();
    for (const panel of stage1Panels) {
      for (const judge of panel.judges as any[]) {
        const judgeId = String(judge._id);
        if (!judgeMap.has(judgeId)) {
          judgeMap.set(judgeId, {
            judgeName: judge.name || 'Unknown',
            assignedTeams: new Set(),
          });
        }
        for (const teamId of panel.teams) {
          judgeMap.get(judgeId)!.assignedTeams.add(String(teamId));
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

    for (const [judgeId, data] of judgeMap.entries()) {
      const scoredTeamIds = scoredTeamsByJudge.get(judgeId) || [];
      const scored = new Set(scoredTeamIds);
      const pendingTeams = [...data.assignedTeams].filter(
        (teamId) => !scored.has(teamId),
      ).length;

      if (pendingTeams > 0) {
        incompleteJudges.push({
          judgeId,
          judgeName: data.judgeName,
          assignedTeams: data.assignedTeams.size,
          scoredTeams: scoredTeamIds.length,
          pendingTeams,
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
    const teams = await this.teamModel
      .find({ _id: { $in: teamIds } }, { name: 1, challenge: 1 })
      .lean()
      .exec();
    const teamsById = new Map(teams.map((team) => [String(team._id), team]));

    return scores.map((score) => {
      const team = teamsById.get(String(score._id));
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
