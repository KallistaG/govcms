import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  private parseUserAgent(ua?: string): { browser: string; device: string } {
    if (!ua) return { browser: 'Unknown Browser', device: 'Unknown Device' };

    let browser = 'Chrome';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edg')) browser = 'Microsoft Edge';

    let device = 'Desktop (Windows)';
    if (ua.includes('iPhone') || ua.includes('iPad')) device = 'Mobile (iOS)';
    else if (ua.includes('Android')) device = 'Mobile (Android)';
    else if (ua.includes('Macintosh')) device = 'Desktop (macOS)';
    else if (ua.includes('Linux')) device = 'Desktop (Linux)';

    return { browser, device };
  }

  async findAllLogs(
    search?: string,
    action?: string,
    entityType?: string,
    userId?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = {};

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (action && action !== 'ALL') where.action = action;
    if (entityType && entityType !== 'ALL') where.entityType = entityType;
    if (userId) where.userId = userId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    return this.prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            department: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async exportCsv(search?: string, action?: string, entityType?: string) {
    const logs = await this.findAllLogs(search, action, entityType);

    const headers = [
      'Log ID',
      'Timestamp',
      'User Email',
      'User Name',
      'Action',
      'Entity Type',
      'Entity ID',
      'Status',
      'IP Address',
      'Browser',
      'Device',
    ];

    const rows = logs.map((log) => [
      log.id,
      new Date(log.createdAt).toISOString(),
      log.user?.email || 'System / Anonymous',
      log.user ? `${log.user.firstName} ${log.user.lastName}` : 'N/A',
      log.action,
      log.entityType,
      log.entityId || 'N/A',
      log.status || 'SUCCESS',
      log.ipAddress || '127.0.0.1',
      log.browser || 'Chrome',
      log.device || 'Desktop (Windows)',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  async createLog(
    userId: string | null,
    action: string,
    entityType: string,
    entityId?: string,
    metadata?: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const { browser, device } = this.parseUserAgent(userAgent);

    return this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId: entityId || null,
        metadata: metadata || null,
        ipAddress: ipAddress || '127.0.0.1',
        userAgent: userAgent || null,
        browser,
        device,
      },
    });
  }
}
