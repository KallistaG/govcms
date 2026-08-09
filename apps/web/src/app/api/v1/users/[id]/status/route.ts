import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { AuthError, AuthConfigurationError, requireAuth } from '@/lib/server-auth';
import { assertAgencyAccess, requireUsersAccess } from '@/lib/admin-rbac';
import { writeAuditLog } from '@/lib/audit';

async function loadTargetUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, agencyId: true, role: true, isActive: true },
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireUsersAccess(await requireAuth(request));
    const { id } = await params;
    const body = (await request.json()) as { isActive?: boolean };
    const target = await loadTargetUser(id);

    if (!target) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    assertAgencyAccess(actor, target.agencyId);

    if (target.role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'SUPER_ADMIN accounts cannot be modified by non-super-admins' }, { status: 403 });
    }

    if (body.isActive === false && id === actor.id) {
      return NextResponse.json({ message: 'Users cannot deactivate their own account' }, { status: 403 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: Boolean(body.isActive) },
      select: { id: true, isActive: true, agencyId: true, role: true },
    });

    await writeAuditLog({
      actor,
      request,
      action: updated.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entityType: 'User',
      entityId: id,
      metadata: { agencyId: updated.agencyId, role: updated.role },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({ message: error?.message || 'Failed to update user status' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return PUT(request, context);
}
