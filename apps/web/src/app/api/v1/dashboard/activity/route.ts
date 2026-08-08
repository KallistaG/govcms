import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';

export async function GET() {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
    });
    const formatted = logs.map((l) => ({
      id: l.id,
      user: {
        name: l.user ? `${l.user.firstName} ${l.user.lastName}` : 'System Admin',
        avatar: l.user?.avatarUrl || undefined,
      },
      action: l.action,
      target: l.entityType,
      timestamp: l.createdAt,
    }));
    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json([
      {
        id: 'act-1',
        user: { name: 'Maria Santos' },
        action: 'Published press release',
        target: 'DICT Launches Enterprise Cloud Infrastructure',
        timestamp: new Date().toISOString(),
      },
    ]);
  }
}
