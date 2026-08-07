import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { QueryMediaDto } from './dto/query-media.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get('storage-stats')
  async getStorageStats(@CurrentUser('id') userId: string) {
    return this.mediaService.getStorageStats(userId);
  }

  @Get('folders')
  async findAllFolders(@CurrentUser('id') userId: string) {
    return this.mediaService.findAllFolders(userId);
  }

  @Post('folders')
  async createFolder(@Body() dto: CreateFolderDto, @CurrentUser('id') userId: string) {
    return this.mediaService.createFolder(dto, userId);
  }

  @Delete('folders/:id')
  async deleteFolder(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.mediaService.deleteFolder(id, userId);
  }

  @Get('assets')
  async findAllAssets(@Query() query: QueryMediaDto, @CurrentUser('id') userId: string) {
    return this.mediaService.findAllAssets(query, userId);
  }

  @Post('assets/upload')
  async uploadAsset(@Body() body: any, @CurrentUser('id') userId: string) {
    return this.mediaService.uploadAsset(body, userId);
  }

  @Patch('assets/:id')
  async renameAsset(
    @Param('id') id: string,
    @Body() body: { filename: string; altText: string },
    @CurrentUser('id') userId: string,
  ) {
    return this.mediaService.renameAsset(id, body.filename, body.altText, userId);
  }

  @Delete('assets/:id')
  async deleteAsset(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.mediaService.deleteAsset(id, userId);
  }

  @Post('assets/bulk-delete')
  @HttpCode(HttpStatus.OK)
  async bulkDeleteAssets(@Body() body: { ids: string[] }, @CurrentUser('id') userId: string) {
    return this.mediaService.bulkDeleteAssets(body.ids, userId);
  }
}
