import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  HttpException,
  HttpStatus,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { Roles } from '../common/decorators/auth.decorators';

@Controller('api/teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post('import')
  async importTeams(
    @Body() body: { rows: Record<string, unknown>[]; rowNumbers?: number[] },
  ) {
    if (!Array.isArray(body?.rows) || body.rows.length === 0) {
      throw new HttpException('No rows to import', HttpStatus.BAD_REQUEST);
    }
    if (body.rows.length > 2000) {
      throw new HttpException(
        'Too many rows in one request (max 2000)',
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.teamsService.importTeams(body.rows, body.rowNumbers);
  }

  @Get('count')
  async getTeamsCount() {
    const count = await this.teamsService.getTeamsCount();
    return { count };
  }

  @Get(':id')
  @Roles('admin', 'judge')
  async getTeamById(@Param('id') id: string, @Req() request: any) {
    if (
      request.user.role === 'judge' &&
      !(await this.teamsService.isAssignedToJudge(id, request.user._id))
    ) {
      throw new ForbiddenException('This team is not assigned to you');
    }
    try {
      const team = await this.teamsService.getTeamById(id);
      if (!team) {
        throw new HttpException('Team not found', HttpStatus.NOT_FOUND);
      }
      return team;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get team',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  async getAllTeams() {
    return await this.teamsService.getAllTeams();
  }

  @Delete(':id')
  async deleteTeam(@Param('id') id: string) {
    try {
      await this.teamsService.deleteTeam(id);
      return { message: 'Team deleted successfully' };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete team',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete()
  async deleteAllTeams() {
    try {
      const result = await this.teamsService.deleteAllTeams();
      return {
        message: 'All teams deleted successfully',
        deletedCount: result.deletedCount,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete all teams',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
