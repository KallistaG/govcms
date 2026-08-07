import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LogoutDto } from './dto/logout.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email.toLowerCase() },
      include: { agency: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid official credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account disabled. Please contact system administrator.');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      // Increment failed login attempts
      const failed = user.failedLoginAttempts + 1;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failed,
          lockoutUntil: failed >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
        },
      });

      throw new UnauthorizedException('Invalid official credentials');
    }

    // Reset failed login attempts on success
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Generate Short-lived Access Token (15 min)
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      agencyId: user.agencyId,
    };
    const accessToken = this.jwtService.sign(accessPayload, { expiresIn: '15m' });

    // Generate Cryptographically Secure Refresh Token
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    const rememberMe = loginDto.rememberMe ?? false;
    const refreshExpirationDays = rememberMe ? 30 : 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpirationDays);

    // Save Refresh Token in Database
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        rememberMe,
        expiresAt,
      },
    });

    // Record Audit Log
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entityType: 'Auth',
        entityId: user.id,
        metadata: { rememberMe, timestamp: new Date().toISOString() },
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      tokenType: 'Bearer',
      expiresIn: 900, // 15 minutes in seconds
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        agency: user.agency ? { id: user.agency.id, name: user.agency.name, code: user.agency.code } : null,
      },
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    const tokenHash = crypto.createHash('sha256').update(dto.refreshToken).digest('hex');

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { agency: true } } },
    });

    if (!storedToken || storedToken.isRevoked) {
      throw new UnauthorizedException('Invalid or revoked refresh token');
    }

    if (new Date() > storedToken.expiresAt) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException('Refresh token expired. Please sign in again.');
    }

    if (!storedToken.user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Revoke old refresh token (Token Rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    // Generate new Refresh Token pair
    const newRawRefreshToken = crypto.randomBytes(40).toString('hex');
    const newRefreshTokenHash = crypto.createHash('sha256').update(newRawRefreshToken).digest('hex');

    const refreshExpirationDays = storedToken.rememberMe ? 30 : 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpirationDays);

    await this.prisma.refreshToken.create({
      data: {
        userId: storedToken.user.id,
        tokenHash: newRefreshTokenHash,
        rememberMe: storedToken.rememberMe,
        expiresAt,
      },
    });

    // Generate new Access Token
    const accessPayload: JwtPayload = {
      sub: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
      agencyId: storedToken.user.agencyId,
    };
    const accessToken = this.jwtService.sign(accessPayload, { expiresIn: '15m' });

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
      tokenType: 'Bearer',
      expiresIn: 900,
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        firstName: storedToken.user.firstName,
        lastName: storedToken.user.lastName,
        role: storedToken.user.role,
        agency: storedToken.user.agency
          ? { id: storedToken.user.agency.id, name: storedToken.user.agency.name, code: storedToken.user.agency.code }
          : null,
      },
    };
  }

  async logout(userId: string, dto?: LogoutDto) {
    if (dto?.refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(dto.refreshToken).digest('hex');
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash, userId },
        data: { isRevoked: true },
      });
    } else {
      // Revoke all active refresh tokens for this user
      await this.prisma.refreshToken.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'LOGOUT',
        entityType: 'Auth',
        entityId: userId,
      },
    });

    return { message: 'Logged out successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Generic success response for security (prevent account enumeration)
    if (!user || !user.isActive) {
      return {
        message: 'If the provided email exists in GovCMS, password reset instructions have been issued.',
      };
    }

    // Invalidate existing active reset tokens
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, isUsed: false },
      data: { isUsed: true },
    });

    // Generate 1-hour expiration reset token
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'FORGOT_PASSWORD_REQUEST',
        entityType: 'Auth',
        entityId: user.id,
      },
    });

    return {
      message: 'If the provided email exists in GovCMS, password reset instructions have been issued.',
      // Demo helper reset token link for easy testing without email gateway
      resetToken: rawResetToken,
      resetUrl: `/reset-password?token=${rawResetToken}`,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken || resetToken.isUsed) {
      throw new BadRequestException('Invalid or already used reset token');
    }

    if (new Date() > resetToken.expiresAt) {
      throw new BadRequestException('Password reset token has expired');
    }

    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(dto.newPassword, saltRounds);

    // Update password, mark token used, and reset failed attempts
    await this.prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash: newPasswordHash,
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });

    await this.prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { isUsed: true },
    });

    // Revoke all existing refresh tokens for security
    await this.prisma.refreshToken.updateMany({
      where: { userId: resetToken.userId, isRevoked: false },
      data: { isRevoked: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: resetToken.userId,
        action: 'RESET_PASSWORD_SUCCESS',
        entityType: 'Auth',
        entityId: resetToken.userId,
      },
    });

    return { message: 'Password reset successfully. You can now log in with your new credentials.' };
  }

  async register(registerDto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: registerDto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email address is already registered in GovCMS');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(registerDto.password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email.toLowerCase(),
        passwordHash,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: registerDto.role || 'EDITOR',
        agencyId: registerDto.agencyId,
      },
      include: { agency: true },
    });

    return {
      message: 'Government user successfully created',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        agency: user.agency ? { id: user.agency.id, name: user.agency.name, code: user.agency.code } : null,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { agency: true },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...profile } = user;
    return profile;
  }
}
