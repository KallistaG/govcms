import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'govcms-secure-secret-key-2026';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    let user = await prisma.user.findUnique({ where: { email } });

    // Seed initial default administrator in PostgreSQL if database has zero users
    if (!user) {
      const userCount = await prisma.user.count().catch(() => 0);
      if (userCount === 0 && (email === 'admin@gov.ph' || email === 'superadmin@gov.ph' || email === 'editor@gov.ph' || email === 'publisher@gov.ph')) {
        const hashedPassword = await bcrypt.hash(password || 'Password123!', 10);
        user = await prisma.user.create({
          data: {
            email,
            passwordHash: hashedPassword,
            firstName: email.startsWith('superadmin') ? 'Super' : email.startsWith('admin') ? 'Agency' : email.startsWith('editor') ? 'Maria' : 'Juan',
            lastName: email.startsWith('superadmin') ? 'Admin' : email.startsWith('admin') ? 'Administrator' : email.startsWith('editor') ? 'Santos' : 'Publisher',
            role: email.startsWith('superadmin') ? 'SUPER_ADMIN' : email.startsWith('admin') ? 'ADMINISTRATOR' : email.startsWith('editor') ? 'EDITOR' : 'PUBLISHER',
            department: 'Public Information Office',
            isActive: true,
          },
        });
      }
    }

    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash).catch(() => false);
    if (!isValid) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    const userProfile = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      department: user.department || 'Public Information Office',
      phone: user.phone || null,
      avatarUrl: user.avatarUrl || null,
      permissions: user.permissions || [],
    };

    const response = NextResponse.json({
      accessToken: token,
      user: userProfile,
    });

    response.cookies.set('govcms_access_token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Login failed' }, { status: 500 });
  }
}
