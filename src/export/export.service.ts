import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Panel, PanelDocument } from '../schemas/panel.schema';
import { Score, ScoreDocument } from '../schemas/score.schema';
import { Stage, StageDocument } from '../schemas/stage.schema';
import { Team, TeamDocument } from '../schemas/team.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { ScoresService } from '../scores/scores.service';
import { StagesService } from '../stages/stages.service';
import { WinnersService } from '../winners/winners.service';

const NATURAL_ORDER = { locale: 'en', numericOrdering: true };

@Injectable()
export class ExportService {
  constructor(
    @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Panel.name) private panelModel: Model<PanelDocument>,
    @InjectModel(Score.name) private scoreModel: Model<ScoreDocument>,
    @InjectModel(Stage.name) private stageModel: Model<StageDocument>,
    private readonly scoresService: ScoresService,
    private readonly stagesService: StagesService,
    private readonly winnersService: WinnersService,
  ) {}

  // One snapshot of all judging data; rankings and winners come from the same code the app shows
  async getExportData() {
    const [teams, judges, panels, scores, stages, weights, finalRanking, stage1Ranking, winners, specialWinners] =
      await Promise.all([
        this.teamModel.find({}, { __v: 0 }).collation(NATURAL_ORDER).sort({ name: 1 }).lean().exec(),
        this.userModel.find({ role: 'judge' }, { name: 1, email: 1 }).collation(NATURAL_ORDER).sort({ name: 1 }).lean().exec(),
        this.panelModel.find({}, { __v: 0 }).collation(NATURAL_ORDER).sort({ stage: 1, name: 1 }).lean().exec(),
        this.scoreModel.find({}, { _id: 0, __v: 0 }).lean().exec(),
        this.stageModel.find({}, { name: 1, timerMinutes: 1, criteria: 1 }).lean().exec(),
        this.stagesService.getFinalWeights(),
        this.scoresService.getTopTeams('final', Number.MAX_SAFE_INTEGER),
        this.scoresService.getTopTeams(1, Number.MAX_SAFE_INTEGER),
        this.winnersService.getWinnersByAward(),
        this.winnersService.getSpecialWinners(),
      ]);
    return {
      generatedAt: new Date(),
      weights,
      teams,
      judges,
      panels,
      scores,
      stages,
      finalRanking,
      stage1Ranking,
      winners,
      specialWinners,
    };
  }
}
