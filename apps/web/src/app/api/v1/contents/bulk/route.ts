import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { AuthError, AuthConfigurationError, requireAuth } from '@/lib/server-auth';
import {
  requireAgencyScopedAccess,
  requireContentEditAccess,
  requireContentDeleteAccess,
  requireContentPublishAccess,
} from '@/lib/cms-access';
import { writeAuditLog } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const actor = await requireAuth(request);
    const { action, ids } = (await request.json()) as { action?: string; ids?: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: 'No items selected' }, { status: 400 });
    }

    const agencyId = requireAgencyScopedAccess(actor);
    const authorizedItems = await prisma.contentItem.findMany({
      where: {
        id: { in: ids },
        ...(agencyId ? { agencyId } : {}),
      },
      select: { id: true },
    });
    const authorizedIds = authorizedItems.map((item) => item.id);

    if (!authorizedIds.length) {
      return NextResponse.json({ message: 'No items selected' }, { status: 404 });
    }

    if (action === 'delete') {
      requireContentDeleteAccess(actor);
      await prisma.contentItem.deleteMany({ where: { id: { in: authorizedIds } } }).catch(() => {});
      await writeAuditLog({
        actor,
        request,
        action: 'CONTENT_BULK_DELETED',
        entityType: 'ContentItem',
        metadata: { count: authorizedIds.length, agencyId },
      });
    } else if (action === 'publish') {
      requireContentPublishAccess(actor);
      await prisma.contentItem.updateMany({
        where: { id: { in: authorizedIds } },
        data: { status: 'PUBLISHED', publishedAt: new Date() },
      }).catch(() => {});
      await writeAuditLog({
        actor,
        request,
        action: 'CONTENT_BULK_PUBLISHED',
        entityType: 'ContentItem',
        metadata: { count: authorizedIds.length, agencyId },
      });
    } else if (action === 'archive') {
      requireContentEditAccess(actor);
      await prisma.contentItem.updateMany({ where: { id: { in: authorizedIds } }, data: { status: 'ARCHIVED' } }).catch(() => {});
      await writeAuditLog({
        actor,
        request,
        action: 'CONTENT_BULK_ARCHIVED',
        entityType: 'ContentItem',
        metadata: { count: authorizedIds.length, agencyId },
      });
    } else {
      return NextResponse.json({ message: 'Unsupported action' }, { status: 400 });
    }

    return NextResponse.json({ message: `Successfully performed ${action}` });
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({ message: error?.message || 'Bulk action failed' }, { status: 500 });
  }
}
