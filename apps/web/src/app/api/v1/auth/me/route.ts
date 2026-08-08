import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'govcms-secure-secret-key-2026';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.sub) {
      return NextResponse.json({ message: 'Invalid session token' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user) {
      return NextResponse.json({ message: 'User account not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      department: user.department || 'Public Information Office',
      phone: user.phone || null,
      avatarUrl: user.avatarUrl || null,
      permissions: user.permissions || [],
    });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Unauthorized' }, { status: 401 });
  }
}
