import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { AuthError, AuthConfigurationError, requireAuth } from '@/lib/server-auth';
import { assertAgencyAccess, requireUsersAccess } from '@/lib/admin-rbac';
import { writeAuditLog } from '@/lib/audit';

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function generateTemporaryPassword(): string {
  return randomBytes(16).toString('hex');
}

async function loadTargetUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, agencyId: true, role: true, isActive: true },
  });
}

export async function POST(
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

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const explicitPassword = normalizeString(body.newPassword);
    const temporaryPassword = explicitPassword || generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { passwordHash: hashedPassword },
    });

    await writeAuditLog({
      actor,
      request,
      action: 'ADMIN_PASSWORD_RESET',
      entityType: 'User',
      entityId: id,
      metadata: {
        agencyId: target.agencyId,
        role: target.role,
      },
    });

    return NextResponse.json({
      message: 'Password reset successfully',
      temporaryPassword: explicitPassword ? undefined : temporaryPassword,
    });
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({ message: error?.message || 'Failed' }, { status: 500 });
  }
}
