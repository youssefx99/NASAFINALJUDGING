import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
  Sse,
  MessageEvent,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TeamsService, UploadProgress } from './teams.service';
import * as multer from 'multer';
import { Observable } from 'rxjs';

@Controller('api/teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post('upload-csv')
  @UseInterceptors(
    FileInterceptor('csvFile', {
      storage: multer.memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (
          file.mimetype === 'text/csv' ||
          file.originalname.endsWith('.csv')
        ) {
          cb(null, true);
        } else {
          cb(new Error('Only CSV files are allowed'), false);
        }
      },
    }),
  )
  async uploadCsv(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    try {
      const result = await this.teamsService.processCsvFile(file.buffer);
      return {
        message: 'Teams uploaded successfully',
        count: result.count,
        teams: result.teams,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to process CSV file',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('upload-csv-stream')
  @UseInterceptors(
    FileInterceptor('csvFile', {
      storage: multer.memoryStorage(),
      fileFilter: (req, file, cb) => {
        if (
          file.mimetype === 'text/csv' ||
          file.originalname.endsWith('.csv')
        ) {
          cb(null, true);
        } else {
          cb(new Error('Only CSV files are allowed'), false);
        }
      },
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
      },
    }),
  )
  async uploadCsvStream(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    try {
      const uploadId = await this.teamsService.startStreamingCsvUpload(
        file.buffer,
      );
      return {
        message: 'Upload started',
        uploadId: uploadId,
        progressUrl: `/api/teams/upload-progress/${uploadId}`,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to start CSV upload',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Sse('upload-progress/:uploadId')
  getUploadProgress(
    @Param('uploadId') uploadId: string,
  ): Observable<MessageEvent> {
    return this.teamsService.getUploadProgress(uploadId);
  }

  @Get('upload-status/:uploadId')
  async getUploadStatus(
    @Param('uploadId') uploadId: string,
  ): Promise<UploadProgress | null> {
    return await this.teamsService.getUploadStatus(uploadId);
  }

  @Post('cancel-upload/:uploadId')
  async cancelUpload(@Param('uploadId') uploadId: string) {
    await this.teamsService.cancelUpload(uploadId);
    return { message: 'Upload cancelled successfully' };
  }

  @Get('count')
  async getTeamsCount() {
    const count = await this.teamsService.getTeamsCount();
    return { count };
  }

  @Post('verify-upload/:uploadId')
  async verifyUpload(@Param('uploadId') uploadId: string) {
    try {
      const verification =
        await this.teamsService.verifyUploadResults(uploadId);
      return verification;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to verify upload',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id')
  async getTeamById(@Param('id') id: string) {
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
