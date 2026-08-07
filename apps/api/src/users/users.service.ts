import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RoleEnum } from '@prisma/client';

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  role?: RoleEnum;
  department?: string;
  phone?: string;
  avatarUrl?: string;
  permissions?: string[];
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  role?: RoleEnum;
  department?: string;
  phone?: string;
  avatarUrl?: string;
  permissions?: string[];
  isActive?: boolean;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllUsers(search?: string, role?: string, department?: string) {
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role && role !== 'ALL') {
      where.role = role as RoleEnum;
    }

    if (department && department !== 'ALL') {
      where.department = department;
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        phone: true,
        avatarUrl: true,
        permissions: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        agency: { select: { id: true, name: true, code: true } },
        _count: { select: { auditLogs: true, contents: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users;
  }

  async findOneUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        phone: true,
        avatarUrl: true,
        permissions: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        agency: { select: { id: true, name: true } },
        auditLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) throw new NotFoundException(`User with ID "${id}" not found`);
    return user;
  }

  async createUser(dto: CreateUserDto, currentUserId: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('User with this email already exists');

    const currentUser = await this.prisma.user.findUnique({ where: { id: currentUserId } });
    const rawPassword = dto.password || 'GovCMS@2026!';
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role || RoleEnum.EDITOR,
        department: dto.department || 'Public Information Office',
        phone: dto.phone || null,
        avatarUrl: dto.avatarUrl || null,
        permissions: (dto.permissions || []) as any,
        agencyId: currentUser?.agencyId || null,
      },
    });

    // Create Audit Log
    await this.prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: 'CREATE',
        entityType: 'User',
        entityId: user.id,
        metadata: { email: user.email, role: user.role, department: user.department },
      },
    });

    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto, currentUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName !== undefined ? dto.firstName : user.firstName,
        lastName: dto.lastName !== undefined ? dto.lastName : user.lastName,
        role: dto.role !== undefined ? dto.role : user.role,
        department: dto.department !== undefined ? dto.department : user.department,
        phone: dto.phone !== undefined ? dto.phone : user.phone,
        avatarUrl: dto.avatarUrl !== undefined ? dto.avatarUrl : user.avatarUrl,
        permissions: dto.permissions !== undefined ? (dto.permissions as any) : user.permissions,
        isActive: dto.isActive !== undefined ? dto.isActive : user.isActive,
      },
    });

    // Create Audit Log
    await this.prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: 'EDIT',
        entityType: 'User',
        entityId: id,
        metadata: { updatedFields: Object.keys(dto) },
      },
    });

    return updated;
  }

  async resetPassword(id: string, newPassword?: string, currentUserId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const pass = newPassword || 'GovCMS@Temp2026!';
    const passwordHash = await bcrypt.hash(pass, 10);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash, failedLoginAttempts: 0, lockoutUntil: null },
    });

    if (currentUserId) {
      await this.prisma.auditLog.create({
        data: {
          userId: currentUserId,
          action: 'RESET_PASSWORD',
          entityType: 'User',
          entityId: id,
          metadata: { email: user.email },
        },
      });
    }

    return { message: 'Password reset successfully', tempPassword: pass };
  }

  async deleteUser(id: string, currentUserId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: {
        userId: currentUserId,
        action: 'DELETE',
        entityType: 'User',
        entityId: id,
        metadata: { email: user.email },
      },
    });

    return { message: 'User deleted successfully' };
  }
}
