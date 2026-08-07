import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PageBuilderService, HomepageSection, PageBlock } from './page-builder.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('page-builder')
export class PageBuilderController {
  constructor(private readonly service: PageBuilderService) {}

  // ─── Homepage Section Builder ───────────────────────────────────────

  @Get('homepage/public')
  async getPublicHomepage() {
    return this.service.getPublicHomepage();
  }

  @Get('homepage')
  @UseGuards(JwtAuthGuard)
  async getHomepage(@CurrentUser('id') userId: string) {
    return this.service.getHomepage(userId);
  }

  @Post('homepage/sections')
  @UseGuards(JwtAuthGuard)
  async saveHomepageSections(
    @Body() body: { sections: HomepageSection[] },
    @CurrentUser('id') userId: string,
  ) {
    return this.service.saveHomepageSections(body.sections, userId);
  }

  @Post('homepage/publish')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async publishHomepage(@CurrentUser('id') userId: string) {
    return this.service.publishHomepage(userId);
  }

  // ─── Notion Block Page Builder ──────────────────────────────────────

  @Get('pages')
  @UseGuards(JwtAuthGuard)
  async getAllPages(@CurrentUser('id') userId: string) {
    return this.service.getAllPages(userId);
  }

  @Get('pages/public/:slug')
  async getPublicPage(@Param('slug') slug: string) {
    return this.service.getPublicPage(slug);
  }

  @Get('pages/:slug')
  @UseGuards(JwtAuthGuard)
  async getPageBlocks(@Param('slug') slug: string, @CurrentUser('id') userId: string) {
    return this.service.getPageBlocks(slug, userId);
  }

  @Post('pages/:slug')
  @UseGuards(JwtAuthGuard)
  async savePageBlocks(
    @Param('slug') slug: string,
    @Body() body: { title: string; blocks: PageBlock[] },
    @CurrentUser('id') userId: string,
  ) {
    return this.service.savePageBlocks(slug, body.title, body.blocks, userId);
  }

  @Post('pages/:slug/publish')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async publishPage(@Param('slug') slug: string, @CurrentUser('id') userId: string) {
    return this.service.publishPage(slug, userId);
  }

  @Delete('pages/:slug')
  @UseGuards(JwtAuthGuard)
  async deletePage(@Param('slug') slug: string) {
    return this.service.deletePage(slug);
  }
}
