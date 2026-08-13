import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { AuthError, AuthConfigurationError, requireAuth } from '@/lib/server-auth';
import { getScopedAgencyId, requireDashboardLoginsAccess } from '@/lib/admin-rbac';

function getDisplayName(user?: { firstName?: string | null; lastName?: string | null } | null) {
  const name = [user?.firstName, user?.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ')
    .trim();

  return name || 'Unknown user';
}

export async function GET(request: Request) {
  try {
    const actor = requireDashboardLoginsAccess(await requireAuth(request));
    const agencyId = getScopedAgencyId(actor);
    const users = await prisma.user.findMany({
      where: agencyId ? { agencyId } : undefined,
      orderBy: { lastLoginAt: 'desc' },
      take: 5,
    });

    const formatted = users.map((u) => ({
      id: u.id,
      userName: getDisplayName(u),
      userEmail: u.email || 'Unknown email',
      role: u.role || 'UNKNOWN',
      ipAddress: 'Unknown IP',
      timestamp: (u.lastLoginAt || u.updatedAt).toISOString(),
      status: u.isActive ? 'SUCCESS' : 'FAILED',
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json([]);
  }
}
