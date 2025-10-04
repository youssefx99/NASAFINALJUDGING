import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScoresController } from './scores.controller';
import { ScoresService } from './scores.service';
import { Score, ScoreSchema } from '../schemas/score.schema';
import { Team, TeamSchema } from '../schemas/team.schema';
import { Panel, PanelSchema } from '../schemas/panel.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Score.name, schema: ScoreSchema },
      { name: Team.name, schema: TeamSchema },
      { name: Panel.name, schema: PanelSchema },
    ]),
  ],
  controllers: [ScoresController],
  providers: [ScoresService],
  exports: [ScoresService],
})
export class ScoresModule {}
