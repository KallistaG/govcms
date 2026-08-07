import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ThemeService } from './theme.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('theme')
export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @Get('public')
  async getPublicTheme() {
    return this.themeService.getPublicTheme();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getTheme(@CurrentUser('id') userId: string) {
    return this.themeService.getTheme(userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async saveTheme(@Body() body: Record<string, any>, @CurrentUser('id') userId: string) {
    return this.themeService.saveTheme(body, userId);
  }

  @Post('publish')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async publishTheme(@CurrentUser('id') userId: string) {
    return this.themeService.publishTheme(userId);
  }
}
