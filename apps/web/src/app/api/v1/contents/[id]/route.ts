import { NextResponse } from 'next/server';
import { ContentStatusEnum, ContentTypeEnum, prisma } from '@govcms/database';
import { AuthError, AuthConfigurationError, requireAuth } from '@/lib/server-auth';
import {
  requireAgencyScopedAccess,
  requireContentDeleteAccess,
  requireContentEditAccess,
  requireContentPublishAccess,
} from '@/lib/cms-access';
import { writeAuditLog } from '@/lib/audit';

function isPublishRequest(body: Record<string, unknown>): boolean {
  return body.isPublished === true || body.status === 'PUBLISHED';
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireContentEditAccess(await requireAuth(request));
    const { id } = await params;
    const agencyId = requireAgencyScopedAccess(actor);
    const item = await prisma.contentItem.findFirst({
      where: {
        id,
        ...(agencyId ? { agencyId } : {}),
      },
      include: { author: { select: { firstName: true, lastName: true, email: true } } },
    });
    if (item) return NextResponse.json({ ...item, isPublished: item.status === 'PUBLISHED' });
    return NextResponse.json({ message: 'Content item not found' }, { status: 404 });
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({ message: error?.message || 'Content item not found' }, { status: 404 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireContentEditAccess(await requireAuth(request));
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const agencyId = requireAgencyScopedAccess(actor);

    const existing = await prisma.contentItem.findFirst({
      where: {
        id,
        ...(agencyId ? { agencyId } : {}),
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Content item not found' }, { status: 404 });
    }

    const wantsPublish = isPublishRequest(body);
    if (wantsPublish) {
      requireContentPublishAccess(actor);
    }

    const updated = await prisma.contentItem.update({
      where: { id: existing.id },
      data: {
        title: typeof body.title === 'string' ? body.title : existing.title,
        type: typeof body.type === 'string' ? (body.type as ContentTypeEnum) : existing.type,
        body: typeof body.body === 'string' ? body.body : existing.body,
        summary: typeof body.summary === 'string' ? body.summary : existing.summary,
        status: wantsPublish ? ('PUBLISHED' as ContentStatusEnum) : (typeof body.status === 'string' ? (body.status as ContentStatusEnum) : existing.status),
        publishedAt: wantsPublish ? existing.publishedAt ?? new Date() : existing.publishedAt,
      },
    });

    await writeAuditLog({
      actor,
      request,
      action: wantsPublish ? 'CONTENT_PUBLISHED' : 'CONTENT_UPDATED',
      entityType: 'ContentItem',
      entityId: updated.id,
      metadata: {
        agencyId: updated.agencyId,
        status: updated.status,
      },
    });

    return NextResponse.json({ ...updated, isPublished: updated.status === 'PUBLISHED' });
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({ message: error?.message || 'Failed to update content item' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return PUT(request, context);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireContentDeleteAccess(await requireAuth(request));
    const { id } = await params;
    const agencyId = requireAgencyScopedAccess(actor);
    const item = await prisma.contentItem.findFirst({
      where: {
        id,
        ...(agencyId ? { agencyId } : {}),
      },
    });

    if (!item) {
      return NextResponse.json({ message: 'Content item not found' }, { status: 404 });
    }

    await prisma.contentItem.delete({ where: { id: item.id } });

    await writeAuditLog({
      actor,
      request,
      action: 'CONTENT_DELETED',
      entityType: 'ContentItem',
      entityId: item.id,
      metadata: {
        agencyId: item.agencyId,
        status: item.status,
      },
    });

    return NextResponse.json({ message: 'Deleted content item successfully' });
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({ message: error?.message || 'Failed to delete content item' }, { status: 500 });
  }
}
