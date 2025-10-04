import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { TeamsModule } from './teams/teams.module';
import { UsersModule } from './users/users.module';
import { PanelsModule } from './panels/panels.module';
import { JudgesModule } from './judges/judges.module';
import { StagesModule } from './stages/stages.module';
import { ScoresModule } from './scores/scores.module';
import { Stage2QualificationModule } from './stage2-qualification/stage2-qualification.module';
import { WinnersModule } from './winners/winners.module';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    DatabaseModule,
    AuthModule,
    TeamsModule,
    UsersModule,
    PanelsModule,
    JudgesModule,
    StagesModule,
    ScoresModule,
    Stage2QualificationModule,
    WinnersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
