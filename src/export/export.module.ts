import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { Panel, PanelSchema } from '../schemas/panel.schema';
import { Score, ScoreSchema } from '../schemas/score.schema';
import { Stage, StageSchema } from '../schemas/stage.schema';
import { Team, TeamSchema } from '../schemas/team.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { ScoresModule } from '../scores/scores.module';
import { StagesModule } from '../stages/stages.module';
import { WinnersModule } from '../winners/winners.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Team.name, schema: TeamSchema },
      { name: User.name, schema: UserSchema },
      { name: Panel.name, schema: PanelSchema },
      { name: Score.name, schema: ScoreSchema },
      { name: Stage.name, schema: StageSchema },
    ]),
    ScoresModule,
    StagesModule,
    WinnersModule,
  ],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
