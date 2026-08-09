import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { AuthError, AuthConfigurationError, requireAuth } from '@/lib/server-auth';
import { getScopedAgencyId, requireAuditReadAccess, sanitizeSensitiveKeys } from '@/lib/admin-rbac';

export async function GET(request: Request) {
  try {
    const actor = requireAuditReadAccess(await requireAuth(request));
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const action = searchParams.get('action') || '';
    const agencyId = getScopedAgencyId(actor);

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
    if (agencyId) {
      where.user = { agencyId };
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { firstName: true, lastName: true, email: true, role: true, agencyId: true } } },
    });

    return NextResponse.json(
      logs.map((log) => ({
        ...log,
        metadata: sanitizeSensitiveKeys(log.metadata ?? null),
      })),
    );
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json([]);
  }
}
