import { prisma } from '@govcms/database';
import type { AuthenticatedUser } from './server-auth';
import { sanitizeSensitiveKeys } from './admin-rbac';

function getRequestIp(request?: Request): string | undefined {
  if (!request) {
    return undefined;
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || undefined;
  }

  return request.headers.get('x-real-ip')?.trim() || undefined;
}

export async function writeAuditLog(params: {
  actor?: AuthenticatedUser | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: unknown;
  request?: Request;
  status?: 'SUCCESS' | 'FAILURE';
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.actor?.id ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        status: params.status ?? 'SUCCESS',
        metadata: params.metadata === undefined ? undefined : (sanitizeSensitiveKeys(params.metadata) as any),
        ipAddress: getRequestIp(params.request),
        userAgent: params.request?.headers.get('user-agent') ?? undefined,
      },
    });
  } catch {
    // Never block the primary mutation on audit logging.
  }
}
