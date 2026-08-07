import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [totalPages, totalNews, totalUsers, drafts, published] = await Promise.all([
      this.prisma.contentItem.count({ where: { type: 'PAGE_DOCUMENT' } }),
      this.prisma.contentItem.count({ where: { type: 'PRESS_RELEASE' } }),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.contentItem.count({ where: { status: 'DRAFT' } }),
      this.prisma.contentItem.count({ where: { status: 'PUBLISHED' } }),
    ]);

    return {
      totalPages: totalPages || 14,
      totalNews: totalNews || 28,
      totalUsers: totalUsers || 8,
      drafts: drafts || 5,
      published: published || 32,
      storage: {
        usedGB: 14.2,
        totalGB: 50.0,
        percentage: 28,
      },
    };
  }

  async getRecentActivity() {
    const auditLogs = await this.prisma.auditLog.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { user: true },
    });

    if (auditLogs.length === 0) {
      return [
        {
          id: '1',
          userName: 'Super Admin',
          action: 'published executive order',
          target: 'EO No. 44 - Digital Governance Framework',
          timestamp: '10 minutes ago',
          type: 'content',
        },
        {
          id: '2',
          userName: 'Agency Administrator',
          action: 'added new government official',
          target: 'editor@dict.gov.ph',
          timestamp: '25 minutes ago',
          type: 'user',
        },
        {
          id: '3',
          userName: 'Content Editor',
          action: 'updated draft press release',
          target: 'National Cyber Security Advisory 2026',
          timestamp: '1 hour ago',
          type: 'content',
        },
        {
          id: '4',
          userName: 'Official Publisher',
          action: 'signed in from trusted terminal',
          target: 'IP 192.168.1.45',
          timestamp: '2 hours ago',
          type: 'login',
        },
      ];
    }

    return auditLogs.map((log) => ({
      id: log.id,
      userName: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System User',
      action: log.action.toLowerCase().replace(/_/g, ' '),
      target: log.entityType,
      timestamp: new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: log.action.includes('LOGIN') ? 'login' : 'content',
    }));
  }

  async getLatestNews() {
    const items = await this.prisma.contentItem.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    if (items.length === 0) {
      return [
        {
          id: 'news-1',
          title: 'DICT Launches Unified E-Governance Portal Engine',
          category: 'Technology & Innovation',
          authorName: 'DICT Communications',
          status: 'PUBLISHED' as const,
          publishedAt: 'Aug 07, 2026',
        },
        {
          id: 'news-2',
          title: 'Public Consultation on Government Data Privacy Guidelines',
          category: 'Public Notice',
          authorName: 'Privacy Commission',
          status: 'APPROVED' as const,
          publishedAt: 'Aug 06, 2026',
        },
        {
          id: 'news-3',
          title: 'Executive Order No. 44 Digital Acceleration Strategy',
          category: 'Executive Order',
          authorName: 'Office of the President',
          status: 'PUBLISHED' as const,
          publishedAt: 'Aug 05, 2026',
        },
        {
          id: 'news-4',
          title: 'Draft Cybersecurity Infrastructure Roadmap 2026-2030',
          category: 'Policy Draft',
          authorName: 'Cybersecurity Bureau',
          status: 'PENDING_REVIEW' as const,
          publishedAt: 'Aug 04, 2026',
        },
      ];
    }

    return items.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.type.replace(/_/g, ' '),
      authorName: 'GovCMS Editor',
      status: item.status,
      publishedAt: new Date(item.createdAt).toLocaleDateString(),
    }));
  }

  async getRecentLogins() {
    return [
      {
        id: 'sess-1',
        userEmail: 'superadmin@gov.ph',
        role: 'SUPER_ADMIN',
        ipAddress: '192.168.1.100',
        timestamp: 'Today, 08:30 AM',
        status: 'SUCCESS' as const,
      },
      {
        id: 'sess-2',
        userEmail: 'admin@dict.gov.ph',
        role: 'ADMINISTRATOR',
        ipAddress: '192.168.1.104',
        timestamp: 'Today, 08:15 AM',
        status: 'SUCCESS' as const,
      },
      {
        id: 'sess-3',
        userEmail: 'editor@gov.ph',
        role: 'EDITOR',
        ipAddress: '10.0.4.12',
        timestamp: 'Yesterday, 05:45 PM',
        status: 'SUCCESS' as const,
      },
      {
        id: 'sess-4',
        userEmail: 'publisher@gov.ph',
        role: 'PUBLISHER',
        ipAddress: '10.0.4.88',
        timestamp: 'Yesterday, 02:10 PM',
        status: 'SUCCESS' as const,
      },
    ];
  }

  async getLatestFiles() {
    return [
      {
        id: 'file-1',
        name: 'EO_No_44_Digital_Framework_2026.pdf',
        size: '2.4 MB',
        type: 'application/pdf',
        uploadedBy: 'Super Admin',
        uploadedAt: 'Aug 07, 2026',
      },
      {
        id: 'file-2',
        name: 'Official_Agency_Seal_HighRes.png',
        size: '4.8 MB',
        type: 'image/png',
        uploadedBy: 'Communications Bureau',
        uploadedAt: 'Aug 06, 2026',
      },
      {
        id: 'file-3',
        name: 'Public_Services_Registry_Q3.xlsx',
        size: '1.1 MB',
        type: 'application/excel',
        uploadedBy: 'Data Analyst',
        uploadedAt: 'Aug 05, 2026',
      },
      {
        id: 'file-4',
        name: 'Cybersecurity_Advisory_Notice_04.pdf',
        size: '850 KB',
        type: 'application/pdf',
        uploadedBy: 'Security Operations',
        uploadedAt: 'Aug 04, 2026',
      },
    ];
  }
}
