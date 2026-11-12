import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Panel } from '../schemas/panel.schema';
import { Score } from '../schemas/score.schema';
import { ScoresService } from '../scores/scores.service';

@Injectable()
export class Stage2QualificationService {
  constructor(
    @InjectModel(Panel.name) private panelModel: Model<Panel>,
    @InjectModel(Score.name) private scoreModel: Model<Score>,
    private readonly scoresService: ScoresService,
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

  // Same ranking as the Stage 1 results (scores rounded, ties broken by more judges, then team name), scored teams only
  async getTopTeamsForQualification(limit: number = 60) {
    const ranked = (await this.scoresService.getTopTeams(1, limit)) as Array<{
      _id: unknown; name: string; challenge: string; averageScore: number; judgeCount: number; hasScore: boolean;
    }>;
    return ranked
      .filter((team) => team.hasScore)
      .map(({ _id, name, challenge, averageScore, judgeCount }) => ({ _id, name, challenge, averageScore, judgeCount }));
  }

  async qualifyTopTeams(limit: number = 60) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
      throw new BadRequestException(`Invalid limit: ${limit}. Must be a whole number between 1 and 500.`);
    }

    const [topTeams, stage2PanelCount] = await Promise.all([
      this.getTopTeamsForQualification(limit),
      this.panelModel.countDocuments({ stage: 2 }).exec(),
    ]);
    if (topTeams.length === 0) {
      throw new BadRequestException('No teams found with Stage 1 scores');
    }
    if (stage2PanelCount === 0) {
      throw new BadRequestException('No Stage 2 panels found. Please create Stage 2 panels first.');
    }

    // Every Stage 2 award panel gets the same qualified teams in a single update
    const topTeamIds = topTeams.map((t) => t._id);
    const result = await this.panelModel
      .updateMany({ stage: 2 }, { teams: topTeamIds })
      .exec();
    console.log(`[QUALIFICATION] Qualified ${topTeamIds.length} teams to ${result.matchedCount} Stage 2 panels`);

    return {
      success: true,
      qualifiedTeams: topTeamIds.length,
      updatedPanels: result.matchedCount,
      teamIds: topTeamIds.map(String),
    };
  }
}
