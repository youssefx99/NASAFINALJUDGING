import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Score, ScoreDocument } from '../schemas/score.schema';
import { Team, TeamDocument } from '../schemas/team.schema';
import { Panel, stage1CriteriaIds } from '../schemas/panel.schema';
import { Stage } from '../schemas/stage.schema';
import { StagesService } from '../stages/stages.service';
import { criterionFraction, QuestionType, roundScore } from '../common/scoring';

@Injectable()
export class ScoresService {
  constructor(
    @InjectModel(Score.name) private scoreModel: Model<ScoreDocument>,
    @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
    @InjectModel(Panel.name) private panelModel: Model<Panel>,
    @InjectModel(Stage.name) private stageModel: Model<Stage>,
    private readonly stagesService: StagesService,
  ) {}

  // The judge must be on a panel of this stage that contains the team; the total is computed
  // here from the answers and the stage criteria, never taken from the client
  async createScore(scoreData: any): Promise<Score> {
    const { judgeId, teamId, panelId } = scoreData;
    const stage = scoreData.stage;
    const hasPanelId = typeof panelId === 'string' && Types.ObjectId.isValid(panelId);
    if (
      ![1, 2, 3].includes(stage) ||
      typeof teamId !== 'string' ||
      !Types.ObjectId.isValid(teamId) ||
      (panelId !== undefined && !hasPanelId) ||
      (stage === 3 && !hasPanelId)
    ) {
      throw new BadRequestException('Invalid score submission');
    }

    // A judge can sit on several Stage 2 award panels, so Stage 2 scores name the panel (award) they are for
    const [candidates, stageDoc] = await Promise.all([
      this.panelModel
        .find(
          { stage, judges: judgeId, teams: teamId, ...(hasPanelId ? { _id: panelId } : {}) },
          { awardType: 1, awardCriteria: 1, criteria: 1, scaleMax: 1, yesNoWeight: 1 },
        )
        .limit(stage === 1 ? 0 : 2)
        .lean()
        .exec(),
      stage === 3
        ? null
        : this.stageModel
            .findOne({ name: `Stage ${stage}` }, { criteria: 1 })
            .lean()
            .exec(),
    ]);
    const panel = candidates[0];
    if (!panel) {
      throw new ForbiddenException('This team is not assigned to you for this stage');
    }
    if (stage === 2 && candidates.length > 1) {
      throw new BadRequestException('You are on more than one award panel for this team; choose the award you are scoring');
    }
    if (stage !== 3 && !stageDoc) {
      throw new BadRequestException('Stage criteria are not configured');
    }

    const submitted =
      scoreData.scores && typeof scoreData.scores === 'object' ? scoreData.scores : {};
    // Yes/no answers are 0 or 1, scale answers 1..scaleMax
    const readAnswers = (name: string, types: QuestionType[], scaleMax: number) => {
      const answers = submitted[name];
      if (
        !Array.isArray(answers) ||
        answers.length !== types.length ||
        !answers.every(
          (value, i) =>
            Number.isInteger(value) && (types[i] === 'scale' ? value >= 1 && value <= scaleMax : value === 0 || value === 1),
        )
      ) {
        throw new BadRequestException(`Invalid answers for "${name}"`);
      }
      return answers as number[];
    };
    const typesOf = (criterion: { questions: string[]; questionTypes?: QuestionType[] }, fallback: QuestionType) =>
      criterion.questions.map((_, i) => criterion.questionTypes?.[i] || fallback);

    const scores: Record<string, number[]> = {};
    const criteriaScores: Record<string, number> = {};
    let totalScore: number;
    let awardType: string | undefined;
    if (stage === 3) {
      const types = (panel.awardCriteria || []).map((q) => q.type || 'scale');
      if (types.length === 0) {
        throw new BadRequestException('This special panel has no questions yet');
      }
      const scaleMax = panel.scaleMax || 5;
      const answers = readAnswers(String(panel._id), types, scaleMax);
      scores[String(panel._id)] = answers;
      totalScore = roundScore(5 * criterionFraction(answers, types, scaleMax, panel.yesNoWeight ?? 0.5));
    } else if (stage === 1) {
      const selected = stage1CriteriaIds(candidates);
      const criteria = stageDoc!.criteria.filter((c) => !selected || selected.has(String(c._id)));
      if (criteria.length === 0) {
        throw new BadRequestException('No Stage 1 criteria are selected for this panel');
      }
      let total = 0;
      let max = 0;
      // Every question is worth 1 point times its criterion weight; criteriaScores holds each criterion's points
      for (const criterion of criteria) {
        const types = typesOf(criterion, 'yesno');
        const answers = readAnswers(criterion.name, types, criterion.scaleMax || 5);
        scores[criterion.name] = answers;
        const points = answers.length * criterionFraction(answers, types, criterion.scaleMax || 5, criterion.yesNoWeight ?? 0.5);
        criteriaScores[criterion.name] = roundScore(points);
        total += points * criterion.weight;
        max += answers.length * criterion.weight;
      }
      totalScore = max > 0 ? roundScore((total / max) * 5) : 0;
    } else {
      awardType = panel.awardType;
      const criterion = stageDoc!.criteria.find((c) => c.name === awardType);
      if (!criterion || criterion.questions.length === 0) {
        throw new BadRequestException('Award criteria are not configured');
      }
      const types = typesOf(criterion, 'scale');
      const scaleMax = criterion.scaleMax || 5;
      const answers = readAnswers(criterion.name, types, scaleMax);
      scores[criterion.name] = answers;
      totalScore = roundScore(5 * criterionFraction(answers, types, scaleMax, criterion.yesNoWeight ?? 0.5));
    }

    return await this.scoreModel
      .findOneAndUpdate(
        {
          judge: scoreData.judgeId,
          team: scoreData.teamId,
          stage: scoreData.stage,
          ...(stage === 2 ? { awardType } : {}),
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
    const hasPanelId = Types.ObjectId.isValid(panelId || '');
    if (stage === 3 && !hasPanelId) return null;
    // Stage 2 scores are per award: the panel tells which award
    const awardType =
      stage === 2 && hasPanelId
        ? (await this.panelModel.findById(panelId, { awardType: 1 }).lean().exec())?.awardType
        : undefined;
    return await this.scoreModel
      .findOne({
        judge: judgeId,
        team: teamId,
        stage: stage,
        ...(awardType ? { awardType } : {}),
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

    const [teams, stage1Averages, awardAverages, weights] = await Promise.all([
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
      stage === 'final' ? this.stagesService.getFinalWeights() : null,
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
        if (roundScore(record.awardAverage) > roundScore(current.averageScore)) {
          current.averageScore = record.awardAverage;
          current.bestAward = award;
        }
        current.judgeCount += record.judgeCount;
      }
    }

    // Scored teams first by score (more judges, then team name, break ties), then unscored teams by name
    const rank = <T extends { name: string; judgeCount?: number }>(rows: T[], hasScore: (row: T) => boolean, score: (row: T) => number) =>
      rows
        .sort(
          (a, b) =>
            Number(hasScore(b)) - Number(hasScore(a)) ||
            (hasScore(a) ? score(b) - score(a) || (b.judgeCount || 0) - (a.judgeCount || 0) : 0) ||
            a.name.localeCompare(b.name, undefined, { numeric: true }),
        )
        .slice(0, limit);

    if (stage === 'final') {
      // Final score: weighted Stage 1 average + best Stage 2 award average (weights set by the admin)
      const finalScores = teams.map((team) => {
        const stage1Score = stage1Scores.get(String(team._id))?.averageScore || 0;
        const stage2 = stage2Scores.get(String(team._id));
        const stage2BestScore = Math.max(stage2?.averageScore || 0, 0);
        return {
          _id: team._id,
          name: team.name,
          challenge: team.challenge,
          stage1Score: roundScore(stage1Score),
          stage2BestScore: roundScore(stage2BestScore),
          bestAward: stage2BestScore > 0 ? stage2!.bestAward : 'N/A',
          finalScore: roundScore(weights!.stage1 * stage1Score + weights!.stage2 * stage2BestScore),
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
        averageScore: roundScore(teamScore?.averageScore || 0),
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
          averageScore: roundScore(result?.averageScore || 0),
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
