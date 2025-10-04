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
import * as multer from 'multer';

@Controller('api/judges')
export class JudgesController {
  constructor(private readonly judgesService: JudgesService) {}

  @Get('assigned-teams')
  async getAssignedTeams(@Req() request: any) {
    try {
      // For now, we'll extract user ID from a simple token
      // In production, you'd use proper JWT middleware
      const authHeader = request.headers.authorization;
      if (!authHeader) {
        throw new HttpException(
          'No authorization header',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [userId] = decoded.split(':');

      return await this.judgesService.getAssignedTeams(userId);
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
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to process CSV file',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
