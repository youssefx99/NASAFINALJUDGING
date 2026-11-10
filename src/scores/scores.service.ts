import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Score, ScoreDocument } from '../schemas/score.schema';
import { Team, TeamDocument } from '../schemas/team.schema';
import { Panel } from '../schemas/panel.schema';
import { Stage } from '../schemas/stage.schema';

@Injectable()
export class ScoresService {
  constructor(
    @InjectModel(Score.name) private scoreModel: Model<ScoreDocument>,
    @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
    @InjectModel(Panel.name) private panelModel: Model<Panel>,
    @InjectModel(Stage.name) private stageModel: Model<Stage>,
  ) {}

  // The judge must be on a panel of this stage that contains the team; the total is computed
  // here from the answers and the stage criteria, never taken from the client
  async createScore(scoreData: any): Promise<Score> {
    const { judgeId, teamId, panelId } = scoreData;
    const stage = scoreData.stage;
    if (
      ![1, 2, 3].includes(stage) ||
      typeof teamId !== 'string' ||
      !Types.ObjectId.isValid(teamId) ||
      (stage === 3 && (typeof panelId !== 'string' || !Types.ObjectId.isValid(panelId)))
    ) {
      throw new BadRequestException('Invalid score submission');
    }

    const [panel, stageDoc] = await Promise.all([
      this.panelModel
        .findOne(
          { stage, judges: judgeId, teams: teamId, ...(stage === 3 ? { _id: panelId } : {}) },
          { awardType: 1, awardCriteria: 1 },
        )
        .lean()
        .exec(),
      stage === 3
        ? null
        : this.stageModel
            .findOne({ name: `Stage ${stage}` }, { criteria: 1 })
            .lean()
            .exec(),
    ]);
    if (!panel) {
      throw new ForbiddenException('This team is not assigned to you for this stage');
    }
    if (stage !== 3 && !stageDoc) {
      throw new BadRequestException('Stage criteria are not configured');
    }

    const submitted =
      scoreData.scores && typeof scoreData.scores === 'object' ? scoreData.scores : {};
    const readAnswers = (name: string, count: number, valid: (value: number) => boolean) => {
      const answers = submitted[name];
      if (
        !Array.isArray(answers) ||
        answers.length !== count ||
        !answers.every((value) => Number.isInteger(value) && valid(value))
      ) {
        throw new BadRequestException(`Invalid answers for "${name}"`);
      }
      return answers as number[];
    };

    const scores: Record<string, number[]> = {};
    const criteriaScores: Record<string, number> = {};
    let totalScore: number;
    let awardType: string | undefined;
    if (stage === 3) {
      const questionCount = (panel.awardCriteria || []).length;
      if (questionCount === 0) {
        throw new BadRequestException('This special panel has no questions yet');
      }
      const answers = readAnswers(String(panel._id), questionCount, (v) => v >= 1 && v <= 5);
      scores[String(panel._id)] = answers;
      totalScore = answers.reduce((sum, v) => sum + v, 0) / answers.length;
    } else if (stage === 1) {
      let total = 0;
      let max = 0;
      for (const criterion of stageDoc!.criteria) {
        const answers = readAnswers(criterion.name, criterion.questions.length, (v) => v === 0 || v === 1);
        scores[criterion.name] = answers;
        criteriaScores[criterion.name] = answers.reduce((sum, v) => sum + v, 0);
        total += criteriaScores[criterion.name] * criterion.weight;
        max += answers.length * criterion.weight;
      }
      totalScore = max > 0 ? (total / max) * 5 : 0;
    } else {
      awardType = panel.awardType;
      const criterion = stageDoc!.criteria.find((c) => c.name === awardType);
      if (!criterion || criterion.questions.length === 0) {
        throw new BadRequestException('Award criteria are not configured');
      }
      const answers = readAnswers(criterion.name, criterion.questions.length, (v) => v >= 1 && v <= 5);
      scores[criterion.name] = answers;
      totalScore = answers.reduce((sum, v) => sum + v, 0) / answers.length;
    }

    return await this.scoreModel
      .findOneAndUpdate(
        {
          judge: scoreData.judgeId,
          team: scoreData.teamId,
          stage: scoreData.stage,
          ...(stage === 3 ? { panel: panelId } : {}),
        },
        {
          totalScore,
          scores,
          criteriaScores,
          awardType,
        },
        { upsert: true, new: true, runValidators: true },
      )
      .exec();
  }

  async getScoresForTeam(teamId: string, stage: number): Promise<Score[]> {
    return await this.scoreModel
      .find({
        team: teamId,
        stage: stage,
      })
      .populate('judge', 'name email _id')
      .lean()
      .exec();
  }

  async getScoresByJudge(judgeId: string): Promise<Score[]> {
    return await this.scoreModel
      .find({ judge: judgeId })
      .populate('team', 'name challenge')
      .populate('judge', 'name email')
      .lean()
      .exec();
  }

  async getScoreByJudgeAndTeam(
    judgeId: string,
    teamId: string,
    stage: number,
    panelId?: string,
  ): Promise<Score | null> {
    if (stage === 3 && !Types.ObjectId.isValid(panelId || '')) return null;
    return await this.scoreModel
      .findOne({
        judge: judgeId,
        team: teamId,
        stage: stage,
        ...(stage === 3 ? { panel: panelId } : {}),
      })
      .lean()
      .exec();
  }

  async getAverageScoreForTeam(teamId: string, stage: number): Promise<number> {
    const scores = await this.getScoresForTeam(teamId, stage);
    if (scores.length === 0) return 0;

    const totalScore = scores.reduce((sum, score) => sum + score.totalScore, 0);
    return totalScore / scores.length;
  }

  async getScoringOverview() {
    // A team counts as scored when ALL judges of its (first) panel scored it
    const [panels, judgesByTeam] = await Promise.all([
      this.panelModel
        .find({}, { stage: 1, judges: 1, teams: 1 })
        .lean()
        .exec(),
      this.scoreModel
        .aggregate([
          {
            $group: {
              _id: { team: '$team', stage: '$stage' },
              judges: { $addToSet: '$judge' },
            },
          },
        ])
        .exec(),
    ]);

    const scoredBy = new Map<string, Set<string>>();
    for (const group of judgesByTeam) {
      scoredBy.set(
        `${group._id.stage}:${group._id.team}`,
        new Set(group.judges.map(String)),
      );
    }

    const overview: Record<string, { scored: number; notScored: number; total: number }> = {};
    for (const stage of [1, 2]) {
      let scored = 0;
      const teamsChecked = new Set<string>();
      for (const panel of panels) {
        if (panel.stage !== stage) continue;
        for (const teamId of panel.teams.map(String)) {
          if (teamsChecked.has(teamId)) continue;
          teamsChecked.add(teamId);
          const scoredByJudges = scoredBy.get(`${stage}:${teamId}`);
          if (panel.judges.every((judgeId) => scoredByJudges?.has(String(judgeId)))) {
            scored++;
          }
        }
      }
      overview[`stage${stage}`] = {
        scored,
        notScored: teamsChecked.size - scored,
        total: teamsChecked.size,
      };
    }

    return overview;
  }

  async getTopTeams(stage: number | 'final', limit: number) {
    if (stage !== 1 && stage !== 2 && stage !== 'final') return [];

    const [teams, stage1Averages, awardAverages] = await Promise.all([
      this.teamModel.find({}, { name: 1, challenge: 1 }).lean().exec(),
      stage === 2
        ? []
        : this.scoreModel
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
            .exec(),
      // Stage 2 per-award averages, in the order each award was first scored (tie-break for the best award)
      stage === 1
        ? []
        : this.scoreModel
            .aggregate([
              { $match: { stage: 2 } },
              {
                $group: {
                  _id: { team: '$team', awardType: '$awardType' },
                  awardAverage: { $avg: '$totalScore' },
                  judgeCount: { $sum: 1 },
                  firstScore: { $min: '$_id' },
                },
              },
              { $sort: { firstScore: 1 } },
            ])
            .exec(),
    ]);

    const stage1Scores = new Map(
      stage1Averages.map((score) => [
        String(score._id),
        { averageScore: score.averageScore, judgeCount: score.judgeCount },
      ]),
    );

    // Stage 2: MAX of per-award averages (awards correspond to Stage 2 panels)
    const stage2Scores = new Map<
      string,
      { averageScore: number; judgeCount: number; bestAward: string }
    >();
    for (const record of awardAverages) {
      const teamId = String(record._id.team);
      const award = record._id.awardType || 'Unknown Award';
      const current = stage2Scores.get(teamId);
      if (!current) {
        stage2Scores.set(teamId, {
          averageScore: record.awardAverage,
          judgeCount: record.judgeCount,
          bestAward: award,
        });
      } else {
        if (record.awardAverage > current.averageScore) {
          current.averageScore = record.awardAverage;
          current.bestAward = award;
        }
        current.judgeCount += record.judgeCount;
      }
    }

    // Scored teams first (by score desc), then unscored teams in original order
    const rank = <T>(rows: T[], hasScore: (row: T) => boolean, score: (row: T) => number) =>
      rows
        .sort((a, b) => {
          if (hasScore(a) && !hasScore(b)) return -1;
          if (!hasScore(a) && hasScore(b)) return 1;
          if (hasScore(a) && hasScore(b)) return score(b) - score(a);
          return 0;
        })
        .slice(0, limit);

    if (stage === 'final') {
      // Final score: 60% Stage 1 average + 40% best Stage 2 award average
      const finalScores = teams.map((team) => {
        const stage1Score = stage1Scores.get(String(team._id))?.averageScore || 0;
        const stage2 = stage2Scores.get(String(team._id));
        const stage2BestScore = Math.max(stage2?.averageScore || 0, 0);
        return {
          _id: team._id,
          name: team.name,
          challenge: team.challenge,
          stage1Score,
          stage2BestScore,
          bestAward: stage2BestScore > 0 ? stage2!.bestAward : 'N/A',
          finalScore: 0.6 * stage1Score + 0.4 * stage2BestScore,
          hasStage1Score: stage1Score > 0,
          hasStage2Score: stage2BestScore > 0,
          hasAnyScore: stage1Score > 0 || stage2BestScore > 0,
        };
      });
      return rank(finalScores, (t) => t.hasAnyScore, (t) => t.finalScore);
    }

    const teamScores = stage === 1 ? stage1Scores : stage2Scores;
    const teamResults = teams.map((team) => {
      const teamScore = teamScores.get(String(team._id));
      return {
        _id: team._id,
        name: team.name,
        challenge: team.challenge,
        averageScore: teamScore?.averageScore || 0,
        judgeCount: teamScore?.judgeCount || 0,
        hasScore: !!teamScore,
      };
    });
    return rank(teamResults, (t) => t.hasScore, (t) => t.averageScore);
  }

  // Special panel ranking: every team in the panel with its average score (unscored teams last)
  async getSpecialPanelResults(panelId: string) {
    if (!Types.ObjectId.isValid(panelId)) throw new BadRequestException('Invalid panel');
    const panel = await this.panelModel
      .findOne({ _id: panelId, stage: 3 }, { name: 1, judges: 1, teams: 1, awardCriteria: 1 })
      .populate('teams', 'name challenge')
      .lean()
      .exec();
    if (!panel) throw new BadRequestException('Special panel not found');
    const averages = await this.scoreModel
      .aggregate([
        { $match: { stage: 3, panel: new Types.ObjectId(panelId) } },
        { $group: { _id: '$team', averageScore: { $avg: '$totalScore' }, judgeCount: { $sum: 1 } } },
      ])
      .exec();
    const byTeam = new Map(averages.map((a) => [String(a._id), a]));
    const teams = (panel.teams as any[])
      .map((team) => {
        const result = byTeam.get(String(team._id));
        return {
          _id: team._id,
          name: team.name,
          challenge: team.challenge,
          averageScore: result?.averageScore || 0,
          judgeCount: result?.judgeCount || 0,
          hasScore: !!result,
        };
      })
      .sort((a, b) =>
        a.hasScore !== b.hasScore
          ? a.hasScore ? -1 : 1
          : b.averageScore - a.averageScore || b.judgeCount - a.judgeCount || a.name.localeCompare(b.name),
      );
    return {
      _id: panel._id,
      name: panel.name,
      judgeCount: panel.judges.length,
      questionCount: (panel.awardCriteria || []).length,
      teams,
    };
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
      .lean()
      .exec();

    return scores;
  }
}
