import { Controller, Post, Get, Body, Param, HttpException, HttpStatus, Req } from '@nestjs/common';
import { ScoresService } from './scores.service';

@Controller('api/scores')
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Post()
  async createScore(@Body() scoreData: any, @Req() request: any) {
    try {
      // Extract judge ID from token
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        throw new HttpException('No authorization header', HttpStatus.UNAUTHORIZED);
      }

      const token = authHeader.replace('Bearer ', '');
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [judgeId] = decoded.split(':');

      console.log('Creating score for judge:', judgeId, 'team:', scoreData.teamId);
      
      return await this.scoresService.createScore({
        ...scoreData,
        judgeId
      });
    } catch (error) {
      console.error('Error creating score:', error);
      throw new HttpException(
        error.message || 'Failed to create score',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('team/:teamId/stage/:stage')
  async getScoresForTeam(@Param('teamId') teamId: string, @Param('stage') stage: string) {
    try {
      return await this.scoresService.getScoresForTeam(teamId, parseInt(stage));
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get scores',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('judge/:judgeId')
  async getScoresByJudge(@Param('judgeId') judgeId: string) {
    try {
      return await this.scoresService.getScoresByJudge(judgeId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get scores',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('judge/:judgeId/team/:teamId/stage/:stage')
  async getScoreByJudgeAndTeam(
    @Param('judgeId') judgeId: string,
    @Param('teamId') teamId: string,
    @Param('stage') stage: string
  ) {
    try {
      return await this.scoresService.getScoreByJudgeAndTeam(judgeId, teamId, parseInt(stage));
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get score',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('overview')
  async getScoringOverview() {
    try {
      return await this.scoresService.getScoringOverview();
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get scoring overview',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('top')
  async getTopTeams(@Req() request: any) {
    try {
      const stage = parseInt(request.query.stage) || 1;
      const limit = parseInt(request.query.limit) || 10;
      return await this.scoresService.getTopTeams(stage, limit);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get top teams',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
