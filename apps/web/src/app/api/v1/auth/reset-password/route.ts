import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import bcrypt from 'bcrypt';
import { createHash } from 'crypto';

const RESET_PASSWORD_MIN_LENGTH = 10;

function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function validatePasswordStrength(password: string): string | null {
  if (password.length < RESET_PASSWORD_MIN_LENGTH) {
    return 'Password must be at least 10 characters long.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must include at least one uppercase letter.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must include at least one lowercase letter.';
  }
  if (!/\d/.test(password)) {
    return 'Password must include at least one number.';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include at least one symbol.';
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json().catch(() => ({}));

    if (!token || !newPassword) {
      return NextResponse.json({ message: 'Reset token and new password are required' }, { status: 400 });
    }

    const passwordError = validatePasswordStrength(String(newPassword));
    if (passwordError) {
      return NextResponse.json({ message: passwordError }, { status: 400 });
    }

    const tokenHash = hashResetToken(String(token));
    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: true,
      },
    });

    if (!tokenRecord || tokenRecord.isUsed || tokenRecord.expiresAt <= new Date()) {
      return NextResponse.json({ message: 'Invalid or expired reset token' }, { status: 400 });
    }

    if (!tokenRecord.user || !tokenRecord.user.isActive) {
      return NextResponse.json({ message: 'Invalid or expired reset token' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: tokenRecord.userId },
        data: { passwordHash: hashedPassword },
      });

      await tx.passwordResetToken.updateMany({
        where: {
          userId: tokenRecord.userId,
          isUsed: false,
        },
        data: {
          isUsed: true,
        },
      });

      await tx.passwordResetToken.update({
        where: { id: tokenRecord.id },
        data: { isUsed: true },
      });
    });

    await prisma.auditLog.create({
      data: {
        userId: tokenRecord.userId,
        action: 'PASSWORD_RESET_COMPLETED',
        entityType: 'User',
        entityId: tokenRecord.userId,
        status: 'SUCCESS',
      },
    }).catch(() => {});

    return NextResponse.json({ message: 'Password successfully updated' });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed to update password' }, { status: 500 });
  }
}
