import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getJwtSecret, isAuthConfigurationError, sanitizeUser } from '@/lib/server-auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const cleanEmail = String(email || '').trim().toLowerCase();

    if (!cleanEmail || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    let user: any = null;
    try {
      user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    } catch {
      return NextResponse.json({ message: 'Authentication service unavailable' }, { status: 503 });
    }

    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ message: 'Account is inactive' }, { status: 403 });
    }

    if (!user.passwordHash) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash).catch(() => false);

    if (!isValid) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: '7d' },
    );

    const userProfile = sanitizeUser({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      department: user.department || 'Public Information Office',
      phone: user.phone || null,
      avatarUrl: user.avatarUrl || null,
      agencyId: user.agencyId || null,
      permissions: user.permissions || [],
    });

    const response = NextResponse.json({
      accessToken: token,
      user: userProfile,
    });

    response.cookies.set('govcms_access_token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error: any) {
    if (isAuthConfigurationError(error)) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: error?.message || 'Login failed' }, { status: 500 });
  }
}
