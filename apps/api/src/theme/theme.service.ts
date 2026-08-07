import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ThemeService {
  constructor(private readonly prisma: PrismaService) {}

  async getTheme(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.agencyId) return null;

    return this.prisma.themeConfig.findFirst({
      where: { agencyId: user.agencyId, isActive: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getPublicTheme() {
    const theme = await this.prisma.themeConfig.findFirst({
      where: { isActive: true, publishedAt: { not: null } },
      orderBy: { publishedAt: 'desc' },
    });

    if (!theme) {
      return {
        websiteName: 'GovCMS Agency Portal',
        logoUrl: null,
        faviconUrl: null,
        primaryColor: '#1d4ed8',
        secondaryColor: '#7c3aed',
        fontHeading: 'Inter',
        fontBody: 'Inter',
        navbarStyle: null,
        footerStyle: null,
        buttonStyle: null,
        darkModeEnabled: false,
      };
    }

    return theme;
  }

  async saveTheme(data: Record<string, any>, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.agencyId) {
      throw new BadRequestException('User must belong to an agency');
    }

    const existing = await this.prisma.themeConfig.findFirst({
      where: { agencyId: user.agencyId },
    });

    if (existing) {
      return this.prisma.themeConfig.update({
        where: { id: existing.id },
        data: {
          websiteName: data.websiteName ?? existing.websiteName,
          logoUrl: data.logoUrl !== undefined ? data.logoUrl : existing.logoUrl,
          faviconUrl: data.faviconUrl !== undefined ? data.faviconUrl : existing.faviconUrl,
          primaryColor: data.primaryColor ?? existing.primaryColor,
          secondaryColor: data.secondaryColor ?? existing.secondaryColor,
          fontHeading: data.fontHeading ?? existing.fontHeading,
          fontBody: data.fontBody ?? existing.fontBody,
          navbarStyle: data.navbarStyle !== undefined ? data.navbarStyle : existing.navbarStyle,
          footerStyle: data.footerStyle !== undefined ? data.footerStyle : existing.footerStyle,
          buttonStyle: data.buttonStyle !== undefined ? data.buttonStyle : existing.buttonStyle,
          darkModeEnabled: data.darkModeEnabled ?? existing.darkModeEnabled,
          customCss: data.customCss !== undefined ? data.customCss : existing.customCss,
        },
      });
    }

    return this.prisma.themeConfig.create({
      data: {
        websiteName: data.websiteName || 'GovCMS Agency Portal',
        logoUrl: data.logoUrl || null,
        faviconUrl: data.faviconUrl || null,
        primaryColor: data.primaryColor || '#1d4ed8',
        secondaryColor: data.secondaryColor || '#7c3aed',
        fontHeading: data.fontHeading || 'Inter',
        fontBody: data.fontBody || 'Inter',
        navbarStyle: data.navbarStyle || null,
        footerStyle: data.footerStyle || null,
        buttonStyle: data.buttonStyle || null,
        darkModeEnabled: data.darkModeEnabled || false,
        customCss: data.customCss || null,
        isActive: true,
        agencyId: user.agencyId,
        authorId: userId,
      },
    });
  }

  async publishTheme(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.agencyId) {
      throw new BadRequestException('User must belong to an agency');
    }

    const theme = await this.prisma.themeConfig.findFirst({
      where: { agencyId: user.agencyId, isActive: true },
    });

    if (!theme) throw new NotFoundException('No theme configuration found');

    return this.prisma.themeConfig.update({
      where: { id: theme.id },
      data: { publishedAt: new Date() },
    });
  }
}
