import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { AuthError, AuthConfigurationError, requireAuth } from '@/lib/server-auth';
import { getScopedAgencyId, requireDashboardAccess } from '@/lib/admin-rbac';

export async function GET(request: Request) {
  try {
    const actor = requireDashboardAccess(await requireAuth(request));
    const agencyId = getScopedAgencyId(actor);
    const where = agencyId ? { user: { agencyId } } : undefined;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { user: { select: { firstName: true, lastName: true, avatarUrl: true, agencyId: true } } },
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
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json([]);
  }
}
