import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JudgesController } from './judges.controller';
import { JudgesService } from './judges.service';
import { User, UserSchema } from '../schemas/user.schema';
import { Panel, PanelSchema } from '../schemas/panel.schema';
import { Team, TeamSchema } from '../schemas/team.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Panel.name, schema: PanelSchema },
      { name: Team.name, schema: TeamSchema },
    ]),
  ],
  controllers: [JudgesController],
  providers: [JudgesService],
  exports: [JudgesService],
})
export class JudgesModule {}
