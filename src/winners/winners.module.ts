import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WinnersController } from './winners.controller';
import { WinnersService } from './winners.service';
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
  controllers: [WinnersController],
  providers: [WinnersService],
  exports: [WinnersService],
})
export class WinnersModule {}
