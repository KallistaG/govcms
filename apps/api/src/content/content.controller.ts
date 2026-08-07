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
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';
import { QueryContentDto } from './dto/query-content.dto';
import { BulkActionDto } from './dto/bulk-action.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('content')
@UseGuards(JwtAuthGuard)
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  async findAll(@Query() query: QueryContentDto) {
    return this.contentService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.contentService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateContentDto, @CurrentUser('id') userId: string) {
    return this.contentService.create(dto, userId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateContentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.contentService.update(id, dto, userId);
  }

  @Delete(':id')
  async softDelete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.contentService.softDelete(id, userId);
  }

  @Post('bulk-delete')
  @HttpCode(HttpStatus.OK)
  async bulkDelete(@Body() dto: BulkActionDto, @CurrentUser('id') userId: string) {
    return this.contentService.bulkDelete(dto, userId);
  }

  @Post('bulk-publish')
  @HttpCode(HttpStatus.OK)
  async bulkPublish(@Body() dto: BulkActionDto, @CurrentUser('id') userId: string) {
    return this.contentService.bulkPublish(dto, userId);
  }

  @Post('bulk-archive')
  @HttpCode(HttpStatus.OK)
  async bulkArchive(@Body() dto: BulkActionDto, @CurrentUser('id') userId: string) {
    return this.contentService.bulkArchive(dto, userId);
  }
}
