import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('recent-activity')
  async getRecentActivity() {
    return this.dashboardService.getRecentActivity();
  }

  @Get('latest-news')
  async getLatestNews() {
    return this.dashboardService.getLatestNews();
  }

  @Get('recent-logins')
  async getRecentLogins() {
    return this.dashboardService.getRecentLogins();
  }

  @Get('latest-files')
  async getLatestFiles() {
    return this.dashboardService.getLatestFiles();
  }
}
