import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SiteSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreateAgencyId(userId?: string): Promise<string> {
    if (userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.agencyId) return user.agencyId;
    }

    const firstAgency = await this.prisma.agency.findFirst();
    if (firstAgency) return firstAgency.id;

    const newAgency = await this.prisma.agency.create({
      data: {
        name: 'Department of Information and Communications Technology',
        code: 'DICT',
        slug: 'dict',
      },
    });

    return newAgency.id;
  }

  async getSettings(userId?: string) {
    const agencyId = await this.getOrCreateAgencyId(userId);

    let settings = await this.prisma.siteSettings.findFirst({
      where: { agencyId },
    });

    if (!settings) {
      settings = await this.prisma.siteSettings.findFirst({
        orderBy: { updatedAt: 'desc' },
      });
    }

    if (!settings) {
      settings = await this.prisma.siteSettings.create({
        data: { agencyId },
      });
    }

    return settings;
  }

  async getPublicSettings() {
    const settings = await this.prisma.siteSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!settings) {
      return {
        websiteName: 'Department of Information and Communications Technology',
        description: 'Official government portal for public services, press releases, executive orders, and agency updates.',
        keywords: 'govcms, philippines, dict, government, public services',
        email: 'info@dict.gov.ph',
        phone: '+63 (02) 8920-0101',
        address: 'DICT Building, C.P. Garcia Ave., Diliman, Quezon City, 1101 Philippines',
        googleMapsUrl: 'https://maps.google.com/maps?q=DICT+Quezon+City&t=&z=15&ie=UTF8&iwloc=&output=embed',
        socialLinks: {
          facebook: 'https://facebook.com/DICTgovph',
          twitter: 'https://twitter.com/DICTgovph',
          youtube: 'https://youtube.com/DICTgovph',
          instagram: 'https://instagram.com/DICTgovph',
        },
        analyticsId: 'G-GOVCMS2026',
        maintenanceMode: false,
        maintenanceMessage: 'The official agency portal is currently undergoing scheduled system maintenance.',
      };
    }

    return settings;
  }

  async updateSettings(data: Record<string, any>, userId?: string) {
    const agencyId = await this.getOrCreateAgencyId(userId);

    let settings = await this.prisma.siteSettings.findFirst({
      where: { agencyId },
    });

    if (!settings) {
      settings = await this.prisma.siteSettings.findFirst({
        orderBy: { updatedAt: 'desc' },
      });
    }

    if (settings) {
      return this.prisma.siteSettings.update({
        where: { id: settings.id },
        data: {
          websiteName: data.websiteName ?? settings.websiteName,
          description: data.description !== undefined ? data.description : settings.description,
          keywords: data.keywords !== undefined ? data.keywords : settings.keywords,
          email: data.email !== undefined ? data.email : settings.email,
          phone: data.phone !== undefined ? data.phone : settings.phone,
          address: data.address !== undefined ? data.address : settings.address,
          googleMapsUrl: data.googleMapsUrl !== undefined ? data.googleMapsUrl : settings.googleMapsUrl,
          socialLinks: data.socialLinks !== undefined ? data.socialLinks : settings.socialLinks,
          analyticsId: data.analyticsId !== undefined ? data.analyticsId : settings.analyticsId,
          smtpHost: data.smtpHost !== undefined ? data.smtpHost : settings.smtpHost,
          smtpPort: data.smtpPort !== undefined ? data.smtpPort : settings.smtpPort,
          smtpUser: data.smtpUser !== undefined ? data.smtpUser : settings.smtpUser,
          smtpPassword: data.smtpPassword !== undefined ? data.smtpPassword : settings.smtpPassword,
          smtpEncryption: data.smtpEncryption !== undefined ? data.smtpEncryption : settings.smtpEncryption,
          smtpSenderName: data.smtpSenderName !== undefined ? data.smtpSenderName : settings.smtpSenderName,
          maintenanceMode: data.maintenanceMode !== undefined ? data.maintenanceMode : settings.maintenanceMode,
          maintenanceMessage: data.maintenanceMessage !== undefined ? data.maintenanceMessage : settings.maintenanceMessage,
        },
      });
    }

    return this.prisma.siteSettings.create({
      data: {
        websiteName: data.websiteName || 'Department of Information and Communications Technology',
        description: data.description || null,
        keywords: data.keywords || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        googleMapsUrl: data.googleMapsUrl || null,
        socialLinks: data.socialLinks || null,
        analyticsId: data.analyticsId || null,
        smtpHost: data.smtpHost || null,
        smtpPort: data.smtpPort || null,
        smtpUser: data.smtpUser || null,
        smtpPassword: data.smtpPassword || null,
        smtpEncryption: data.smtpEncryption || null,
        smtpSenderName: data.smtpSenderName || null,
        maintenanceMode: data.maintenanceMode || false,
        maintenanceMessage: data.maintenanceMessage || null,
        agencyId,
      },
    });
  }
}
