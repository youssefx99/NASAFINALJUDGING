import {
  Controller,
  Get,
  Post,
  Req,
  HttpException,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JudgesService } from './judges.service';
import { Roles } from '../common/decorators/auth.decorators';
import * as multer from 'multer';

@Controller('api/judges')
export class JudgesController {
  constructor(private readonly judgesService: JudgesService) {}

  @Get('assigned-teams')
  @Roles('judge')
  async getAssignedTeams(@Req() request: any) {
    try {
      return await this.judgesService.getAssignedTeams(request.user._id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get assigned teams',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('upload-csv')
  @UseInterceptors(
    FileInterceptor('csvFile', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 1024 * 1024 },
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
      const result = await this.judgesService.processCsvFile(file.buffer);
      return {
        message: 'Judges uploaded successfully',
        count: result.count,
        judges: result.judges,
        credentials: result.credentials,
        errors: result.errors,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to process CSV file',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
