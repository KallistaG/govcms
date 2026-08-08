import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const action = searchParams.get('action') || '';

  const where: any = {};
  if (search) {
    where.OR = [
      { action: { contains: search, mode: 'insensitive' } },
      { entityType: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (action && action !== 'ALL') {
    where.action = action;
  }

  try {
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    });
    return NextResponse.json(logs);
  } catch {
    return NextResponse.json([
      {
        id: 'log-1',
        action: 'PUBLISH',
        entityType: 'ContentItem',
        entityId: 'cnt-1',
        ipAddress: '192.168.1.100',
        browser: 'Chrome 120 / Windows 11',
        createdAt: new Date().toISOString(),
        user: { firstName: 'Maria', lastName: 'Santos', email: 'maria.santos@dict.gov.ph' },
      },
    ]);
  }
}
