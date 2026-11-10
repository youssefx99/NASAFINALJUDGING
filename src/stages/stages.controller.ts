import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { StagesService } from './stages.service';
import { Roles } from '../common/decorators/auth.decorators';

@Controller('api/stages')
export class StagesController {
  constructor(private readonly stagesService: StagesService) {}

  @Roles('admin', 'judge')
  @Get()
  async getAllAvaStages() {
    try {
      return await this.stagesService.getAllStages();
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get stages',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Roles('admin', 'judge')
  @Get(':name')
  async getStageByName(@Param('name') name: string) {
    try {
      const decodedName = decodeURIComponent(name);
      return await this.stagesService.getStageByName(decodedName);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get stage',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Added: Get criteria for specific award type
  @Roles('admin', 'judge')
  @Get('award/:awardType')
  async getAwardCriteria(@Param('awardType') awardType: string) {
    try {
      const decodedAward = decodeURIComponent(awardType);
      return await this.stagesService.getAwardCriteria(decodedAward);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get award criteria',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':name')
  async updateStage(@Param('name') name: string, @Body() updateData: any) {
    try {
      const decodedName = decodeURIComponent(name);
      console.log(
        'Updating stage:',
        decodedName,
        'with data:',
        JSON.stringify(updateData, null, 2),
      );
      return await this.stagesService.updateStage(decodedName, updateData);
    } catch (error) {
      console.error('Error updating stage:', error);
      throw new HttpException(
        error.message || 'Failed to update stage',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
