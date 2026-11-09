import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { Team, TeamSchema } from '../schemas/team.schema';
import { Score, ScoreSchema } from '../schemas/score.schema';
import { Panel, PanelSchema } from '../schemas/panel.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Team.name, schema: TeamSchema },
      { name: Score.name, schema: ScoreSchema },
      { name: Panel.name, schema: PanelSchema },
    ]),
  ],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
