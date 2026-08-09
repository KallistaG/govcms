import { NextResponse } from 'next/server';
import { prisma, RoleEnum } from '@govcms/database';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { AuthError, AuthConfigurationError, requireAuth } from '@/lib/server-auth';
import {
  assertAgencyAccess,
  getScopedAgencyId,
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

function generateTemporaryPassword(): string {
  return randomBytes(16).toString('hex');
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

export async function GET(request: Request) {
  try {
    const actor = requireUsersAccess(await requireAuth(request));
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const agencyId = getScopedAgencyId(actor);

    const where: any = {};
    if (agencyId) {
      where.agencyId = agencyId;
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role && role !== 'ALL') {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: safeUserSelect(),
    });

    return NextResponse.json(users);
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({ message: error?.message || 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = requireUsersAccess(await requireAuth(request));
    const body = (await request.json()) as Record<string, unknown>;
    const requestedRole = normalizeString(body.role) as RoleEnum | null;
    const role = requestedRole || 'EDITOR';

    if (role === 'SUPER_ADMIN' && actor.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Only SUPER_ADMIN can create another SUPER_ADMIN' }, { status: 403 });
    }

    const requestedAgencyId = normalizeString(body.agencyId);
    assertAgencyAccess(actor, requestedAgencyId);

    const password = normalizeString(body.password);
    const temporaryPassword = password || generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    const agencyId = actor.role === 'SUPER_ADMIN'
      ? requestedAgencyId ?? actor.agencyId ?? null
      : actor.agencyId ?? requestedAgencyId ?? null;

    const created = await prisma.user.create({
      data: {
        email: String(body.email || '').trim().toLowerCase(),
        passwordHash: hashedPassword,
        firstName: String(body.firstName || '').trim(),
        lastName: String(body.lastName || '').trim(),
        role,
        department: normalizeString(body.department) || 'Public Information Office',
        phone: normalizeString(body.phone),
        avatarUrl: normalizeString(body.avatarUrl),
        permissions: normalizePermissions(body.permissions),
        isActive: true,
        agencyId,
      },
      select: safeUserSelect(),
    });

    await writeAuditLog({
      actor,
      request,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: created.id,
      metadata: {
        email: created.email,
        role: created.role,
        agencyId: created.agencyId,
      },
    });

    return NextResponse.json({
      ...created,
      temporaryPassword: body.password ? undefined : temporaryPassword,
    });
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({ message: error?.message || 'Failed to create user' }, { status: 500 });
  }
}
