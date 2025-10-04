import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PanelsController } from './panels.controller';
import { PanelsService } from './panels.service';
import { Panel, PanelSchema } from '../schemas/panel.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { ScoresModule } from '../scores/scores.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Panel.name, schema: PanelSchema },
      { name: User.name, schema: UserSchema },
    ]),
    ScoresModule,
  ],
  controllers: [PanelsController],
  providers: [PanelsService],
  exports: [PanelsService],
})
export class PanelsModule {}
