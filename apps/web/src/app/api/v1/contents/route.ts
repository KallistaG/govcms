import { NextResponse } from 'next/server';
import { ContentTypeEnum, ContentStatusEnum, prisma } from '@govcms/database';
import { getOrBootstrapAgency } from '@/lib/agency-bootstrap';
import { AuthError, AuthConfigurationError, requireAuth } from '@/lib/server-auth';
import {
  requireAgencyScopedAccess,
  requireContentEditAccess,
  requireContentPublishAccess,
} from '@/lib/cms-access';
import { writeAuditLog } from '@/lib/audit';

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

async function resolveContentAgencyId(actor: { role: string; agencyId: string | null }, requestedAgencyId?: string | null): Promise<string> {
  if (actor.role === 'SUPER_ADMIN') {
    const agencyId = normalizeString(requestedAgencyId) || normalizeString(actor.agencyId);
    if (agencyId) {
      return agencyId;
    }

    const agency = await getOrBootstrapAgency();
    return agency.id;
  }

  return requireAgencyScopedAccess(actor as any) as string;
}

export async function GET(request: Request) {
  try {
    const actor = requireContentEditAccess(await requireAuth(request));
    const agencyId = requireAgencyScopedAccess(actor);
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const where: any = {};
    if (agencyId) {
      where.agencyId = agencyId;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) {
      if (status === 'PUBLISHED') where.status = 'PUBLISHED';
      if (status === 'DRAFT') where.status = 'DRAFT';
    }
    if (type) {
      where.type = type;
    }

    const total = await prisma.contentItem.count({ where });
    const data = await prisma.contentItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { author: { select: { firstName: true, lastName: true, email: true } } },
    });

    const formatted = data.map((item) => ({
      ...item,
      isPublished: item.status === 'PUBLISHED',
    }));

    return NextResponse.json({
      data: formatted,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    });
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });
  }
}

export async function POST(request: Request) {
  try {
    const actor = requireContentEditAccess(await requireAuth(request));
    const body = (await request.json()) as Record<string, unknown>;
    const slug =
      (typeof body.slug === 'string' && body.slug.trim()) ||
      (typeof body.title === 'string'
        ? body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
        : '') ||
      `item-${Date.now()}`;
    const wantsPublish = body.isPublished === true || body.status === 'PUBLISHED';
    if (wantsPublish) {
      requireContentPublishAccess(actor);
    }

    const agencyId = await resolveContentAgencyId(actor, normalizeString(body.agencyId));
    const created = await prisma.contentItem.create({
      data: {
        title: typeof body.title === 'string' ? body.title : '',
        slug,
        type: typeof body.type === 'string' ? (body.type as ContentTypeEnum) : 'PAGE_DOCUMENT',
        body: typeof body.body === 'string' ? body.body : '',
        summary: typeof body.summary === 'string' ? body.summary : '',
        status: wantsPublish ? ('PUBLISHED' as ContentStatusEnum) : 'DRAFT',
        publishedAt: wantsPublish ? new Date() : null,
        authorId: actor.id,
        agencyId,
      },
    });

    await writeAuditLog({
      actor,
      request,
      action: wantsPublish ? 'CONTENT_PUBLISHED' : 'CONTENT_CREATED',
      entityType: 'ContentItem',
      entityId: created.id,
      metadata: {
        agencyId: created.agencyId,
        status: created.status,
        type: created.type,
      },
    });

    return NextResponse.json({ ...created, isPublished: created.status === 'PUBLISHED' });
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({ message: error?.message || 'Failed to create content' }, { status: 500 });
  }
}
