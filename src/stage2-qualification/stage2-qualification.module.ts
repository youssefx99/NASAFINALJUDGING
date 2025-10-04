import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Stage2QualificationController } from './stage2-qualification.controller';
import { Stage2QualificationService } from './stage2-qualification.service';
import { Panel, PanelSchema } from '../schemas/panel.schema';
import { Score, ScoreSchema } from '../schemas/score.schema';
import { Team, TeamSchema } from '../schemas/team.schema';
import { User, UserSchema } from '../schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Panel.name, schema: PanelSchema },
      { name: Score.name, schema: ScoreSchema },
      { name: Team.name, schema: TeamSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [Stage2QualificationController],
  providers: [Stage2QualificationService],
  exports: [Stage2QualificationService],
})
export class Stage2QualificationModule {}
