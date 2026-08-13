import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { AuthError, AuthConfigurationError, requireAuth } from '@/lib/server-auth';
import { getScopedAgencyId, requireDashboardAccess } from '@/lib/admin-rbac';

function getDisplayName(user?: { firstName?: string | null; lastName?: string | null } | null) {
  if (!user) {
    return 'System';
  }

  const name = [user.firstName, user.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ')
    .trim();

  return name || 'System';
}

function getActivityType(action?: string | null, entityType?: string | null, hasUser = true) {
  const normalizedAction = action?.toLowerCase() ?? '';
  const normalizedEntity = entityType?.toLowerCase() ?? '';

  if (!hasUser) {
    return 'system' as const;
  }

  if (normalizedAction.includes('login')) {
    return 'login' as const;
  }

  if (normalizedEntity.includes('user')) {
    return 'user' as const;
  }

  if (
    normalizedEntity.includes('content') ||
    normalizedEntity.includes('page') ||
    normalizedEntity.includes('news') ||
    normalizedEntity.includes('menu') ||
    normalizedEntity.includes('theme')
  ) {
    return 'content' as const;
  }

  return 'system' as const;
}

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
      userName: getDisplayName(l.user),
      userAvatar: l.user?.avatarUrl || undefined,
      action: l.action || 'performed an action',
      target: l.entityType || undefined,
      timestamp: l.createdAt.toISOString(),
      type: getActivityType(l.action, l.entityType, !!l.user),
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json([]);
  }
}
