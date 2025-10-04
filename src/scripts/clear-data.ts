import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Panel, PanelDocument } from '../schemas/panel.schema';
import { Team, TeamDocument } from '../schemas/team.schema';
import { Stage, StageDocument } from '../schemas/stage.schema';
import { Score, ScoreDocument } from '../schemas/score.schema';

async function resetDatabase() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
  const panelModel = app.get<Model<PanelDocument>>(getModelToken(Panel.name));
  const teamModel = app.get<Model<TeamDocument>>(getModelToken(Team.name));
  const stageModel = app.get<Model<StageDocument>>(getModelToken(Stage.name));
  const scoreModel = app.get<Model<ScoreDocument>>(getModelToken(Score.name));

  try {
    console.log('🚨 Resetting database…');

    // delete all documents in each collection
    await Promise.all([
      userModel.deleteMany({}),
      panelModel.deleteMany({}),
      teamModel.deleteMany({}),
      stageModel.deleteMany({}),
      scoreModel.deleteMany({}),
    ]);

    console.log('✅ All collections cleared successfully!');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  } finally {
    await app.close();
  }
}

resetDatabase().catch(console.error);
