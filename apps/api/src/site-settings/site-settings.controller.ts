import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SiteSettingsService } from './site-settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('site-settings')
export class SiteSettingsController {
  constructor(private readonly settingsService: SiteSettingsService) {}

  @Get('public')
  async getPublicSettings() {
    return this.settingsService.getPublicSettings();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getSettings(@CurrentUser('id') userId: string) {
    return this.settingsService.getSettings(userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async updateSettings(@Body() body: Record<string, any>, @CurrentUser('id') userId: string) {
    return this.settingsService.updateSettings(body, userId);
  }
}
