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
import { UsersService, CreateUserDto, UpdateUserDto } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAllUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('department') department?: string,
  ) {
    return this.usersService.findAllUsers(search, role, department);
  }

  @Get(':id')
  async findOneUser(@Param('id') id: string) {
    return this.usersService.findOneUser(id);
  }

  @Post()
  async createUser(@Body() dto: CreateUserDto, @CurrentUser('id') currentUserId: string) {
    return this.usersService.createUser(dto, currentUserId);
  }

  @Patch(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.usersService.updateUser(id, dto, currentUserId);
  }

  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Param('id') id: string,
    @Body('newPassword') newPassword?: string,
    @CurrentUser('id') currentUserId?: string,
  ) {
    return this.usersService.resetPassword(id, newPassword, currentUserId);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string, @CurrentUser('id') currentUserId: string) {
    return this.usersService.deleteUser(id, currentUserId);
  }
}
