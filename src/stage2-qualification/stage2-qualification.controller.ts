import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { Stage2QualificationService } from './stage2-qualification.service';

@Controller('api/stage2-qualification')
export class Stage2QualificationController {
  constructor(
    private readonly qualificationService: Stage2QualificationService,
  ) {}

  @Get('stats')
  async getStats() {
    return this.qualificationService.getQualificationStats();
  }

  @Get('incomplete-judges')
  async getIncompleteJudges(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.qualificationService.getIncompleteJudges(pageNum, limitNum);
  }

  @Get('top-teams')
  async getTopTeams(@Query('limit') limit?: string) {
    const teamLimit = limit ? parseInt(limit, 10) : 60;
    return this.qualificationService.getTopTeamsForQualification(teamLimit);
  }

  @Post('qualify')
  async qualifyTeams(@Body() body: { limit?: number }) {
    const limit = body.limit || 60;
    return this.qualificationService.qualifyTopTeams(limit);
  }
}
