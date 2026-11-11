import { Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { promisify } from 'util';
import { gzip } from 'zlib';
import { ExportService } from './export.service';

const gzipAsync = promisify(gzip);

@Controller('api/export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  // Sent gzip-compressed: the full export can exceed the 4.5 MB serverless response limit as plain JSON
  @Get()
  async getExportData(@Req() request: Request, @Res() response: Response) {
    const body = JSON.stringify(await this.exportService.getExportData());
    response.type('application/json').vary('Accept-Encoding');
    if (!/\bgzip\b/.test(String(request.headers['accept-encoding'] || ''))) {
      response.send(body);
      return;
    }
    response.setHeader('Content-Encoding', 'gzip');
    response.send(await gzipAsync(body));
  }
}
