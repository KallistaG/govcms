import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { AuthError, AuthConfigurationError, requireAuth } from '@/lib/server-auth';
import { getScopedAgencyId, requireDashboardLoginsAccess } from '@/lib/admin-rbac';

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
      userName: `${u.firstName} ${u.lastName}`,
      userEmail: u.email,
      role: u.role,
      ipAddress: '192.168.1.100',
      loginTime: u.lastLoginAt || u.updatedAt,
      status: u.isActive ? 'Active' : 'Suspended',
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json([]);
  }
}
