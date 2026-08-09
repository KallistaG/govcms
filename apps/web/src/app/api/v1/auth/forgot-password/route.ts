import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { createHash, randomBytes } from 'crypto';

const RESET_TOKEN_TTL_MS = 45 * 60 * 1000;
const DEV_RESET_LINK_ENABLED =
  process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEV_RESET_LINK === 'true';

function normalizeEmail(input: unknown): string {
  return String(input || '').trim().toLowerCase();
}

function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function getAppBaseUrl(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // fall through to request origin
    }
  }

  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = normalizeEmail(body.email);
    const genericMessage = 'If an account exists for this email, password reset instructions have been generated.';

    if (!email) {
      return NextResponse.json({ message: genericMessage });
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (user && user.isActive) {
      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = hashResetToken(rawToken);
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

      await prisma.$transaction(async (tx) => {
        await tx.passwordResetToken.updateMany({
          where: {
            userId: user.id,
            isUsed: false,
          },
          data: {
            isUsed: true,
          },
        });

        await tx.passwordResetToken.create({
          data: {
            tokenHash,
            userId: user.id,
            expiresAt,
          },
        });
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'PASSWORD_RESET_REQUESTED',
          entityType: 'User',
          entityId: user.id,
          status: 'SUCCESS',
          metadata: {
            expiresAt: expiresAt.toISOString(),
          },
        },
      }).catch(() => {});

      if (DEV_RESET_LINK_ENABLED) {
        return NextResponse.json({
          message: genericMessage,
          resetUrl: `${getAppBaseUrl(request)}/admin/reset-password?token=${rawToken}`,
        });
      }
    }

    return NextResponse.json({
      message: genericMessage,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed' }, { status: 500 });
  }
}
