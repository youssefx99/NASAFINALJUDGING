import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PanelsService } from './panels.service';

@Controller('api/panels')
export class PanelsController {
  constructor(private readonly panelsService: PanelsService) {}

  @Get()
  async getAllPanels() {
    return await this.panelsService.getAllPanels();
  }

  @Get(':id')
  async getPanelById(@Param('id') id: string) {
    const panel = await this.panelsService.findById(id);
    if (!panel) {
      throw new HttpException('Panel not found', HttpStatus.NOT_FOUND);
    }
    return panel;
  }

  @Post()
  async createPanel(@Body() panelData: any) {
    try {
      return await this.panelsService.createPanel(panelData);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create panel',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Added: Create all 10 Stage 2 award panels at once
  @Post('stage2/initialize')
  async initializeStage2Panels() {
    try {
      return await this.panelsService.createStage2Panels();
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to initialize Stage 2 panels',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id')
  async updatePanel(@Param('id') id: string, @Body() panelData: any) {
    try {
      return await this.panelsService.updatePanel(id, panelData);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update panel',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':id')
  async deletePanel(@Param('id') id: string) {
    try {
      await this.panelsService.deletePanel(id);
      return { message: 'Panel deleted successfully' };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete panel',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
