import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
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
  } catch {
    return NextResponse.json([]);
  }
}
