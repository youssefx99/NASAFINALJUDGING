import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Panel, PanelDocument } from '../schemas/panel.schema';
import { Score, ScoreDocument } from '../schemas/score.schema';
import { Team, TeamDocument } from '../schemas/team.schema';

export interface Winner {
  awardType: string;
  winnerTeam: {
    _id: string;
    name: string;
    challenge: string;
    leaderName: string;
    leaderEmail: string;
    members: string[];
  };
  finalScore: number;
  judgeCount: number;
  averageScore: number;
}

export interface WinnersSummary {
  totalAwardPanels: number;
  totalTeamsEvaluated: number;
  averageScoreAcrossPanels: number;
  highestScore: number;
  lowestScore: number;
}

export const AWARD_TYPES = [
  'Best Use of Science',
  'Best Use of Data',
  'Best Use of Technology',
  'Galactic Impact',
  'Best Mission Concept',
  'Most Inspirational',
  'Best Use of Storytelling',
  'Global Connection',
  'Art & Technology',
  'Local Impact',
];

@Injectable()
export class WinnersService {
  constructor(
    @InjectModel(Score.name) private scoreModel: Model<ScoreDocument>,
    @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
    @InjectModel(Panel.name) private panelModel: Model<PanelDocument>,
  ) {}

  /**
   * Get the winner for each award panel
   * NEW LOGIC: Uses final scores (Stage 1 60% + Stage 2 40%) ranking
   * First team encountered for each award type wins that award
   */
  async getWinnersByAward(): Promise<Winner[]> {
    const teamFinalScores = await this.rankTeamsByBestAward();

    // Assign winners: first team encountered for each award wins
    const winners: Winner[] = [];
    const assignedAwards = new Set<string>();

    for (const teamData of teamFinalScores) {
      const awardType = teamData.stage2BestAward;

      // Skip if this award is already assigned or invalid
      if (!awardType || assignedAwards.has(awardType)) {
        continue;
      }

      // This team wins this award!
      assignedAwards.add(awardType);
      
      winners.push({
        awardType,
        winnerTeam: {
          _id: teamData.team._id.toString(),
          name: teamData.team.name,
          challenge: teamData.team.challenge,
          leaderName: teamData.team.leaderName,
          leaderEmail: teamData.team.leaderEmail,
          members: teamData.team.members || [],
        },
        finalScore: teamData.finalScore,
        judgeCount: teamData.judgeCount,
        averageScore: teamData.stage2BestScore,
      });

      // Stop if all awards are assigned
      if (assignedAwards.size === AWARD_TYPES.length) {
        break;
      }
    }

    return winners;
  }

  /**
   * Ceremony leaderboard: each team competes only in its best award (same rule as the winners),
   * so per award the winner is the top team and the finalists are the next ones,
   * returned alphabetically without scores so their placing is not revealed.
   * Special panels follow as extra categories, ranked by their own average score.
   */
  async getLeaderboard(finalistCount = 4) {
    const [teamFinalScores, specialPanels, specialAverages] = await Promise.all([
      this.rankTeamsByBestAward(),
      this.panelModel.find({ stage: 3 }, { name: 1 }).sort({ createdAt: 1 }).lean().exec(),
      this.scoreModel
        .aggregate([
          { $match: { stage: 3 } },
          {
            $group: {
              _id: { panel: '$panel', team: '$team' },
              averageScore: { $avg: '$totalScore' },
              judgeCount: { $sum: 1 },
            },
          },
          { $lookup: { from: 'teams', localField: '_id.team', foreignField: '_id', as: 'team', pipeline: [{ $project: { name: 1, challenge: 1 } }] } },
          { $unwind: '$team' },
        ])
        .exec(),
    ]);
    const toEntry = (id: string, awardType: string, teams: Array<{ _id: string; name: string; challenge: string }>, special: boolean) => ({
      id,
      awardType,
      special,
      winner: teams[0] || null,
      finalists: teams
        .slice(1, 1 + finalistCount)
        .sort((a, b) => a.name.localeCompare(b.name)),
    });

    const regular = AWARD_TYPES.map((awardType) => {
      const teams = teamFinalScores
        .filter((teamData) => teamData.stage2BestAward === awardType)
        .map(({ team }) => ({
          _id: team._id.toString(),
          name: team.name,
          challenge: team.challenge,
        }));
      return toEntry(awardType, awardType, teams, false);
    });

    const special = specialPanels.map((panel) => {
      const teams = specialAverages
        .filter((record) => String(record._id.panel) === String(panel._id))
        .sort((a, b) => b.averageScore - a.averageScore || b.judgeCount - a.judgeCount || a.team.name.localeCompare(b.team.name))
        .map((record) => ({ _id: String(record.team._id), name: record.team.name, challenge: record.team.challenge }));
      return toEntry(`special:${panel._id}`, panel.name, teams, true);
    });

    return [...regular, ...special];
  }

  /**
   * Teams with Stage 2 award scores, each with its best award and final score
   * (Stage 1 60% + best Stage 2 award 40%), sorted by final score (highest first)
   */
  private async rankTeamsByBestAward() {
    const [stage1Averages, awardAverages] = await Promise.all([
      this.scoreModel
        .aggregate([
          { $match: { stage: 1 } },
          { $group: { _id: '$team', averageScore: { $avg: '$totalScore' } } },
        ])
        .exec(),
      // Stage 2 per-award averages, in the order each award was first scored (tie-break for the best award)
      this.scoreModel
        .aggregate([
          { $match: { stage: 2, awardType: { $nin: [null, ''] } } },
          {
            $group: {
              _id: { team: '$team', awardType: '$awardType' },
              averageScore: { $avg: '$totalScore' },
              judgeCount: { $sum: 1 },
              firstScore: { $min: '$_id' },
            },
          },
          { $sort: { firstScore: 1 } },
        ])
        .exec(),
    ]);

    const stage1ByTeam = new Map(
      stage1Averages.map((s) => [String(s._id), s.averageScore as number]),
    );

    // Find best Stage 2 award for each team (awards require Stage 2 scores)
    const bestAwardByTeam = new Map<
      string,
      { award: string; average: number; judgeCount: number }
    >();
    for (const record of awardAverages) {
      const teamId = String(record._id.team);
      const best = bestAwardByTeam.get(teamId);
      if (record.averageScore > (best?.average || 0)) {
        bestAwardByTeam.set(teamId, {
          award: record._id.awardType,
          average: record.averageScore,
          judgeCount: record.judgeCount,
        });
      }
    }

    const teams = await this.teamModel
      .find({ _id: { $in: [...bestAwardByTeam.keys()] } })
      .lean()
      .exec();

    const teamFinalScores: Array<{
      team: any;
      stage1Score: number;
      stage2BestScore: number;
      stage2BestAward: string;
      finalScore: number;
      judgeCount: number;
    }> = teams.map((team) => {
      const best = bestAwardByTeam.get(String(team._id))!;
      // Calculate final score (60% Stage 1 + 40% Stage 2 best)
      const stage1Percent = ((stage1ByTeam.get(String(team._id)) || 0) / 5) * 100;
      const stage2Percent = (best.average / 5) * 100;
      return {
        team,
        stage1Score: stage1Percent,
        stage2BestScore: stage2Percent,
        stage2BestAward: best.award,
        finalScore: stage1Percent * 0.6 + stage2Percent * 0.4,
        judgeCount: best.judgeCount,
      };
    });

    // Sort by final score (highest first)
    return teamFinalScores.sort((a, b) => b.finalScore - a.finalScore);
  }

  /**
   * Get all winners with additional details
   */
  async getAllWinners(): Promise<Winner[]> {
    return this.getWinnersByAward();
  }

  /**
   * Get summary statistics for winners
   */
  async getWinnersSummary(): Promise<WinnersSummary> {
    const winners = await this.getWinnersByAward();

    if (winners.length === 0) {
      return {
        totalAwardPanels: 0,
        totalTeamsEvaluated: 0,
        averageScoreAcrossPanels: 0,
        highestScore: 0,
        lowestScore: 0,
      };
    }

    const scores = winners.map((w) => w.finalScore);
    const totalTeamsEvaluated = await this.getTotalTeamsEvaluated();

    return {
      totalAwardPanels: winners.length,
      totalTeamsEvaluated,
      averageScoreAcrossPanels:
        scores.reduce((sum, score) => sum + score, 0) / scores.length,
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
    };
  }

  /**
   * Get the winner for a specific award type
   */
  async getWinnerByAwardType(awardType: string): Promise<Winner | null> {
    const winners = await this.getWinnersByAward();
    return winners.find((w) => w.awardType === awardType) || null;
  }

  /**
   * Get detailed score breakdown for a specific winner
   */
  async getWinnerScoreBreakdown(awardType: string, teamId: string) {
    const scores = await this.scoreModel
      .find({
        stage: 2,
        awardType: awardType,
        team: teamId,
      })
      .populate('judge', 'name email')
      .lean()
      .exec();

    return scores.map((score) => ({
      judgeName: (score.judge as any)?.name || 'Unknown Judge',
      judgeEmail: (score.judge as any)?.email || '',
      totalScore: score.totalScore,
      scores: score.scores,
      criteriaScores: score.criteriaScores,
      submittedAt: (score as any).createdAt,
    }));
  }

  /**
   * Get total number of teams that were evaluated in Stage 2
   */
  private async getTotalTeamsEvaluated(): Promise<number> {
    const uniqueTeams = await this.scoreModel.distinct('team', { stage: 2 });
    return uniqueTeams.length;
  }

  /**
   * Get teams ranked by their best score across all award panels
   * This shows which teams performed best overall in Stage 2
   */
  async getTeamsRankedByBestScore(limit: number = 10) {
    // Get all Stage 2 scores grouped by team and award type
    const awardAverages = await this.scoreModel
      .aggregate([
        { $match: { stage: 2 } },
        {
          $group: {
            _id: { team: '$team', awardType: '$awardType' },
            awardAverage: { $avg: '$totalScore' },
            judgeCount: { $sum: 1 },
          },
        },
      ])
      .exec();

    // Group by team and find the best score for each team
    const teamBestScores = new Map();

    awardAverages.forEach((record) => {
      const teamId = record._id.team.toString();
      const awardAvg = record.awardAverage;

      if (!teamBestScores.has(teamId)) {
        teamBestScores.set(teamId, {
          _id: record._id.team,
          bestScore: awardAvg,
          bestAward: record._id.awardType,
          totalAwards: 1,
          totalJudges: record.judgeCount,
        });
      } else {
        const current = teamBestScores.get(teamId);
        // Update if this award has a higher score
        if (awardAvg > current.bestScore) {
          current.bestScore = awardAvg;
          current.bestAward = record._id.awardType;
        }
        current.totalAwards += 1;
        current.totalJudges += record.judgeCount;
      }
    });

    // Convert to array and sort by best score
    const rankedTeams = Array.from(teamBestScores.values())
      .sort((a, b) => b.bestScore - a.bestScore)
      .slice(0, limit);

    // Populate team details
    const teamIds = rankedTeams.map((t) => t._id);
    const teams = await this.teamModel
      .find({ _id: { $in: teamIds } })
      .lean()
      .exec();
    const teamsById = new Map(teams.map((t) => [t._id.toString(), t]));

    return rankedTeams.map((rank) => {
      const team = teamsById.get(rank._id.toString());
      return {
        ...rank,
        team: team
          ? {
              _id: team._id.toString(),
              name: team.name,
              challenge: team.challenge,
              leaderName: team.leaderName,
              leaderEmail: team.leaderEmail,
              members: (team as any).members || [],
            }
          : null,
      };
    });
  }
}
