import { NextResponse } from 'next/server';
import { prisma, RoleEnum } from '@govcms/database';
import bcrypt from 'bcrypt';
import { AuthError, AuthConfigurationError, requireAuth } from '@/lib/server-auth';
import {
  assertAgencyAccess,
  requireUsersAccess,
} from '@/lib/admin-rbac';
import { writeAuditLog } from '@/lib/audit';

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function normalizePermissions(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((permission): permission is string => typeof permission === 'string')
    .map((permission) => permission.trim())
    .filter(Boolean);
}

function safeUserSelect() {
  return {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    department: true,
    phone: true,
    avatarUrl: true,
    permissions: true,
    isActive: true,
    lastLoginAt: true,
    createdAt: true,
    updatedAt: true,
    agencyId: true,
  } as const;
}

async function loadTargetUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      agencyId: true,
      role: true,
      isActive: true,
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireUsersAccess(await requireAuth(request));
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: safeUserSelect(),
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    assertAgencyAccess(actor, user.agencyId);

    return NextResponse.json(user);
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({ message: error?.message || 'User not found' }, { status: 404 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireUsersAccess(await requireAuth(request));
    const { id } = await params;
    const target = await loadTargetUser(id);

    if (!target) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    assertAgencyAccess(actor, target.agencyId);

    if (target.role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'SUPER_ADMIN accounts cannot be modified by non-super-admins' }, { status: 403 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const requestedRole = normalizeString(body.role) as RoleEnum | null;

    if (requestedRole === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Only SUPER_ADMIN can promote a user to SUPER_ADMIN' }, { status: 403 });
    }

    if (body.isActive === false && id === actor.id) {
      return NextResponse.json({ message: 'Users cannot deactivate their own account' }, { status: 403 });
    }

    if (body.isActive !== undefined && target.role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'SUPER_ADMIN accounts cannot be modified by non-super-admins' }, { status: 403 });
    }

    const dataToUpdate: Record<string, unknown> = {};
    if (body.firstName !== undefined) dataToUpdate.firstName = String(body.firstName || '').trim();
    if (body.lastName !== undefined) dataToUpdate.lastName = String(body.lastName || '').trim();
    if (body.email !== undefined) dataToUpdate.email = String(body.email || '').trim().toLowerCase();
    if (body.role !== undefined) dataToUpdate.role = requestedRole || target.role;
    if (body.department !== undefined) dataToUpdate.department = normalizeString(body.department);
    if (body.phone !== undefined) dataToUpdate.phone = normalizeString(body.phone);
    if (body.avatarUrl !== undefined) dataToUpdate.avatarUrl = normalizeString(body.avatarUrl);
    if (body.permissions !== undefined) dataToUpdate.permissions = normalizePermissions(body.permissions);
    if (body.isActive !== undefined) dataToUpdate.isActive = Boolean(body.isActive);
    if (body.agencyId !== undefined && actor.role === 'SUPER_ADMIN') {
      dataToUpdate.agencyId = normalizeString(body.agencyId);
    }

    if (body.password) {
      dataToUpdate.passwordHash = await bcrypt.hash(String(body.password), 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
      select: safeUserSelect(),
    });

    await writeAuditLog({
      actor,
      request,
      action: body.isActive === false ? 'USER_DEACTIVATED' : body.isActive === true ? 'USER_ACTIVATED' : 'USER_UPDATED',
      entityType: 'User',
      entityId: updated.id,
      metadata: {
        changedFields: Object.keys(dataToUpdate),
        role: updated.role,
        agencyId: updated.agencyId,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({ message: error?.message || 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireUsersAccess(await requireAuth(request));
    const { id } = await params;
    const target = await loadTargetUser(id);

    if (!target) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    assertAgencyAccess(actor, target.agencyId);

    if (target.role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'SUPER_ADMIN accounts cannot be deleted by non-super-admins' }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });

    await writeAuditLog({
      actor,
      request,
      action: 'USER_DELETED',
      entityType: 'User',
      entityId: id,
      metadata: {
        agencyId: target.agencyId,
        role: target.role,
      },
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({ message: error?.message || 'Failed to delete user' }, { status: 500 });
  }
}
