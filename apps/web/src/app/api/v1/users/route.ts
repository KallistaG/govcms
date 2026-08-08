import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import bcrypt from 'bcrypt';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || '';

  const where: any = {};
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

  try {
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    return NextResponse.json(users);
  } catch {
    return NextResponse.json([
      {
        id: 'u1',
        email: 'superadmin@gov.ph',
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        department: 'IT & Digital Services',
        isActive: true,
      },
    ]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const hashedPassword = await bcrypt.hash(body.password || 'Password123!', 10);

    const created = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash: hashedPassword,
        firstName: body.firstName,
        lastName: body.lastName,
        role: body.role || 'EDITOR',
        department: body.department || 'Public Information Office',
        phone: body.phone || null,
        avatarUrl: body.avatarUrl || null,
        permissions: body.permissions || [],
        isActive: true,
      },
    });

    return NextResponse.json(created);
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed' }, { status: 500 });
  }
}
