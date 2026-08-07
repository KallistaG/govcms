import { Controller, Get, Query, Header, Res, UseGuards } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response } from 'express';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  async findAllLogs(
    @Query('search') search?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.auditLogsService.findAllLogs(
      search,
      action,
      entityType,
      userId,
      startDate,
      endDate,
    );
  }

  @Get('export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="govcms-audit-logs.csv"')
  async exportCsv(
    @Res() res: Response,
    @Query('search') search?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
  ) {
    const csvData = await this.auditLogsService.exportCsv(search, action, entityType);
    res.send(csvData);
  }
}
