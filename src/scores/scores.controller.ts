import { Controller, Post, Get, Body, Param, HttpException, HttpStatus, Req, ForbiddenException } from '@nestjs/common';
import { ScoresService } from './scores.service';
import { Roles } from '../common/decorators/auth.decorators';

@Controller('api/scores')
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Post()
  @Roles('judge')
  async createScore(@Body() scoreData: any, @Req() request: any) {
    try {
      return await this.scoresService.createScore({
        ...scoreData,
        judgeId: request.user._id,
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
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
  @Roles('admin', 'judge')
  async getScoreByJudgeAndTeam(
    @Param('judgeId') judgeId: string,
    @Param('teamId') teamId: string,
    @Param('stage') stage: string,
    @Req() request: any,
  ) {
    if (request.user.role === 'judge' && judgeId !== request.user._id) {
      throw new ForbiddenException('You can only view your own scores');
    }
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
      const stage =
        request.query.stage === 'final'
          ? 'final'
          : parseInt(request.query.stage) || 1;
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
