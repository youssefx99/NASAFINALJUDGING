import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

@Injectable()
export class WinnersService {
  constructor(
    @InjectModel(Score.name) private scoreModel: Model<ScoreDocument>,
    @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
  ) {}

  /**
   * Get the winner for each award panel
   * NEW LOGIC: Uses final scores (Stage 1 60% + Stage 2 40%) ranking
   * First team encountered for each award type wins that award
   */
  async getWinnersByAward(): Promise<Winner[]> {
    const awardTypes = [
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

    // Get all teams with Stage 1 and Stage 2 scores
    const allTeams = await this.teamModel.find().exec();
    const teamFinalScores: Array<{
      team: any;
      stage1Score: number;
      stage2BestScore: number;
      stage2BestAward: string;
      finalScore: number;
      judgeCount: number;
    }> = [];

    // Calculate final score for each team
    for (const team of allTeams) {
      // Get Stage 1 average
      const stage1Scores = await this.scoreModel
        .find({ team: team._id, stage: 1 })
        .exec();

      const stage1Avg = stage1Scores.length > 0
        ? stage1Scores.reduce((sum, s) => sum + s.totalScore, 0) / stage1Scores.length
        : 0;

      // Get all Stage 2 scores grouped by award type
      const stage2Scores = await this.scoreModel
        .find({ team: team._id, stage: 2 })
        .exec();

      // IMPORTANT: Only skip if no Stage 2 scores (awards require Stage 2)
      if (stage2Scores.length === 0) continue;

      // Find best Stage 2 award for this team
      const awardAverages = new Map<string, { scores: number[]; count: number }>();
      
      stage2Scores.forEach((score) => {
        if (!score.awardType) return;
        if (!awardAverages.has(score.awardType)) {
          awardAverages.set(score.awardType, { scores: [], count: 0 });
        }
        awardAverages.get(score.awardType).scores.push(score.totalScore);
        awardAverages.get(score.awardType).count++;
      });

      let bestAward = '';
      let bestAwardAvg = 0;
      let bestAwardJudgeCount = 0;

      awardAverages.forEach((data, awardType) => {
        const avg = data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length;
        if (avg > bestAwardAvg) {
          bestAwardAvg = avg;
          bestAward = awardType;
          bestAwardJudgeCount = data.count;
        }
      });

      // Calculate final score (60% Stage 1 + 40% Stage 2 best)
      const stage1Percent = (stage1Avg / 5) * 100;
      const stage2Percent = (bestAwardAvg / 5) * 100;
      const finalScore = stage1Percent * 0.6 + stage2Percent * 0.4;

      teamFinalScores.push({
        team,
        stage1Score: stage1Percent,
        stage2BestScore: stage2Percent,
        stage2BestAward: bestAward,
        finalScore,
        judgeCount: bestAwardJudgeCount,
      });
    }

    // Sort by final score (highest first)
    teamFinalScores.sort((a, b) => b.finalScore - a.finalScore);

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
      if (assignedAwards.size === awardTypes.length) {
        break;
      }
    }

    return winners;
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
    const teams = await this.teamModel.find({ _id: { $in: teamIds } }).exec();

    return rankedTeams.map((rank) => {
      const team = teams.find((t) => t._id.toString() === rank._id.toString());
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
