import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Score, ScoreDocument } from '../schemas/score.schema';
import { Team, TeamDocument } from '../schemas/team.schema';
import { Panel } from '../schemas/panel.schema';

@Injectable()
export class ScoresService {
  constructor(
    @InjectModel(Score.name) private scoreModel: Model<ScoreDocument>,
    @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
    @InjectModel(Panel.name) private panelModel: Model<Panel>,
  ) {}

  async createScore(scoreData: any): Promise<Score> {
    // Check if score already exists for this judge, team, and stage
    const existingScore = await this.scoreModel.findOne({
      judge: scoreData.judgeId,
      team: scoreData.teamId,
      stage: scoreData.stage,
    });

    if (existingScore) {
      // Update existing score
      existingScore.totalScore = scoreData.totalScore;
      existingScore.scores = scoreData.scores;
      existingScore.criteriaScores = scoreData.criteriaScores || {};
      existingScore.awardType = scoreData.awardType; // Added
      return await existingScore.save();
    } else {
      // Create new score
      const newScore = new this.scoreModel({
        judge: scoreData.judgeId,
        team: scoreData.teamId,
        stage: scoreData.stage,
        totalScore: scoreData.totalScore,
        scores: scoreData.scores,
        criteriaScores: scoreData.criteriaScores || {},
        awardType: scoreData.awardType, // Added
      });
      return await newScore.save();
    }
  }

  async getScoresForTeam(teamId: string, stage: number): Promise<Score[]> {
    return await this.scoreModel
      .find({
        team: teamId,
        stage: stage,
      })
      .populate('judge', 'name email _id')
      .exec();
  }

  async getScoresByJudge(judgeId: string): Promise<Score[]> {
    return await this.scoreModel
      .find({ judge: judgeId })
      .populate('team', 'name challenge')
      .populate('judge', 'name email')
      .exec();
  }

  async getScoreByJudgeAndTeam(
    judgeId: string,
    teamId: string,
    stage: number,
  ): Promise<Score | null> {
    return await this.scoreModel
      .findOne({
        judge: judgeId,
        team: teamId,
        stage: stage,
      })
      .exec();
  }

  async getAverageScoreForTeam(teamId: string, stage: number): Promise<number> {
    const scores = await this.getScoresForTeam(teamId, stage);
    if (scores.length === 0) return 0;

    const totalScore = scores.reduce((sum, score) => sum + score.totalScore, 0);
    return totalScore / scores.length;
  }

  async getScoringOverview() {
    // Stage 1: Check teams that have been scored by ALL judges in their panel
    const stage1Panels = await this.panelModel
      .find({ stage: 1 })
      .populate('judges')
      .populate('teams')
      .exec();

    let stage1ScoredCount = 0;
    let stage1TotalCount = 0;
    const stage1TeamsChecked = new Set<string>();

    for (const panel of stage1Panels) {
      const judgeIds = (panel.judges as any[]).map((j) =>
        typeof j === 'string' ? j : j._id.toString(),
      );
      const teamIds = (panel.teams as any[]).map((t) =>
        typeof t === 'string' ? t : t._id.toString(),
      );

      for (const teamId of teamIds) {
        if (stage1TeamsChecked.has(teamId)) continue;
        stage1TeamsChecked.add(teamId);
        stage1TotalCount++;

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
          stage1ScoredCount++;
        }
      }
    }

    // Stage 2: Check teams that have been scored by ALL judges in their panel
    const stage2Panels = await this.panelModel
      .find({ stage: 2 })
      .populate('judges')
      .populate('teams')
      .exec();

    let stage2ScoredCount = 0;
    let stage2TotalCount = 0;
    const stage2TeamsChecked = new Set<string>();

    for (const panel of stage2Panels) {
      const judgeIds = (panel.judges as any[]).map((j) =>
        typeof j === 'string' ? j : j._id.toString(),
      );
      const teamIds = (panel.teams as any[]).map((t) =>
        typeof t === 'string' ? t : t._id.toString(),
      );

      for (const teamId of teamIds) {
        if (stage2TeamsChecked.has(teamId)) continue;
        stage2TeamsChecked.add(teamId);
        stage2TotalCount++;

        // Get all scores for this team in Stage 2
        const scores = await this.scoreModel
          .find({ team: teamId, stage: 2 })
          .exec();

        const scoredByJudges = scores.map((s) => s.judge.toString());

        // Check if ALL judges in the panel scored this team
        const allJudgesScored = judgeIds.every((judgeId) =>
          scoredByJudges.includes(judgeId),
        );

        if (allJudgesScored) {
          stage2ScoredCount++;
        }
      }
    }

    return {
      stage1: {
        scored: stage1ScoredCount,
        notScored: stage1TotalCount - stage1ScoredCount,
        total: stage1TotalCount,
      },
      stage2: {
        scored: stage2ScoredCount,
        notScored: stage2TotalCount - stage2ScoredCount,
        total: stage2TotalCount,
      },
    };
  }

  async getTopTeams(stage: number, limit: number) {
    // Get ALL teams first
    const allTeams = await this.teamModel.find().exec();

    if (stage === 1) {
      // Stage 1: Simple average across all judges
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
        ])
        .exec();

      // Create a map of team scores
      const scoreMap = new Map();
      scores.forEach((score) => {
        scoreMap.set(score._id.toString(), {
          averageScore: score.averageScore,
          judgeCount: score.judgeCount,
        });
      });

      // Process all teams
      const teamResults = allTeams.map((team) => {
        const teamScore = scoreMap.get(team._id.toString());
        return {
          _id: team._id,
          name: team.name,
          challenge: team.challenge,
          averageScore: teamScore?.averageScore || 0,
          judgeCount: teamScore?.judgeCount || 0,
          hasScore: !!teamScore,
        };
      });

      // Sort: scored teams first (by score desc), then unscored teams
      teamResults.sort((a, b) => {
        if (a.hasScore && !b.hasScore) return -1;
        if (!a.hasScore && b.hasScore) return 1;
        if (a.hasScore && b.hasScore) return b.averageScore - a.averageScore;
        return 0; // Both unscored, maintain original order
      });

      return teamResults.slice(0, limit);
    } else if (stage === 2) {
      // Stage 2: MAX of per-award averages (awards correspond to Stage 2 panels)
      // First, get all Stage 2 scores grouped by team and awardType
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

      // Now group by team and take the MAX award average
      const teamScores = new Map();
      for (const record of awardAverages) {
        const teamId = record._id.team.toString();
        const awardAvg = record.awardAverage;

        if (!teamScores.has(teamId)) {
          teamScores.set(teamId, {
            averageScore: awardAvg,
            judgeCount: record.judgeCount,
            awardCount: 1,
          });
        } else {
          const current = teamScores.get(teamId);
          // Take the MAX award average
          if (awardAvg > current.averageScore) {
            current.averageScore = awardAvg;
          }
          current.judgeCount += record.judgeCount;
          current.awardCount += 1;
        }
      }

      // Process all teams
      const teamResults = allTeams.map((team) => {
        const teamScore = teamScores.get(team._id.toString());
        return {
          _id: team._id,
          name: team.name,
          challenge: team.challenge,
          averageScore: teamScore?.averageScore || 0,
          judgeCount: teamScore?.judgeCount || 0,
          hasScore: !!teamScore,
        };
      });

      // Sort: scored teams first (by score desc), then unscored teams
      teamResults.sort((a, b) => {
        if (a.hasScore && !b.hasScore) return -1;
        if (!a.hasScore && b.hasScore) return 1;
        if (a.hasScore && b.hasScore) return b.averageScore - a.averageScore;
        return 0; // Both unscored, maintain original order
      });

      return teamResults.slice(0, limit);
    }

    return [];
  }

  // Added: Get top 60 teams from Stage 1 for Stage 2 qualification
  async getTop60TeamsFromStage1() {
    const topTeams = await this.getTopTeams(1, 60);
    return topTeams;
  }

  // Added: Get Stage 2 scores by award type
  async getStage2ScoresByAward(awardType: string) {
    const scores = await this.scoreModel
      .find({
        stage: 2,
        awardType: awardType,
      })
      .populate('team')
      .populate('judge')
      .exec();

    return scores;
  }
}
