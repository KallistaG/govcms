import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MenusService } from './menus.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { ReorderMenuItemsDto } from './dto/reorder-items.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MenuLocationEnum } from '@prisma/client';

@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Get('public/:location')
  async getPublicMenuByLocation(@Param('location') location: MenuLocationEnum) {
    return this.menusService.getPublicMenuByLocation(location);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAllMenus(@CurrentUser('id') userId: string) {
    return this.menusService.findAllMenus(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOneMenu(@Param('id') id: string) {
    return this.menusService.findOneMenu(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createMenu(@Body() dto: CreateMenuDto, @CurrentUser('id') userId: string) {
    return this.menusService.createMenu(dto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteMenu(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.menusService.deleteMenu(id, userId);
  }

  @Post('items')
  @UseGuards(JwtAuthGuard)
  async createMenuItem(@Body() dto: CreateMenuItemDto, @CurrentUser('id') userId: string) {
    return this.menusService.createMenuItem(dto, userId);
  }

  @Patch('items/:id')
  @UseGuards(JwtAuthGuard)
  async updateMenuItem(
    @Param('id') id: string,
    @Body() dto: Partial<CreateMenuItemDto>,
    @CurrentUser('id') userId: string,
  ) {
    return this.menusService.updateMenuItem(id, dto, userId);
  }

  @Delete('items/:id')
  @UseGuards(JwtAuthGuard)
  async deleteMenuItem(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.menusService.deleteMenuItem(id, userId);
  }

  @Post('reorder')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async reorderItems(@Body() dto: ReorderMenuItemsDto, @CurrentUser('id') userId: string) {
    return this.menusService.reorderItems(dto, userId);
  }
}
