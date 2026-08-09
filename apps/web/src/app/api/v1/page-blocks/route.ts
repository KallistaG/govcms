import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { getOrBootstrapAgency } from '@/lib/agency-bootstrap';
import { AuthError, AuthConfigurationError, requireAuth } from '@/lib/server-auth';
import {
  requireAgencyScopedAccess,
  requireContentEditAccess,
  requireContentPublishAccess,
} from '@/lib/cms-access';
import { writeAuditLog } from '@/lib/audit';

async function resolveAgencyId(actor: { role: string; agencyId: string | null }): Promise<string> {
  if (actor.role === 'SUPER_ADMIN') {
    if (actor.agencyId?.trim()) {
      return actor.agencyId.trim();
    }

    const agency = await getOrBootstrapAgency();
    return agency.id;
  }

  return requireAgencyScopedAccess(actor as any) as string;
}

function parseBlocks(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && typeof value === 'object' && Array.isArray((value as { blocks?: unknown[] }).blocks)) {
    return (value as { blocks: unknown[] }).blocks;
  }

  return [];
}

export async function GET(request: Request) {
  try {
    const actor = requireContentEditAccess(await requireAuth(request));
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug') || 'about';
    const agencyId = requireAgencyScopedAccess(actor);

    const item = await prisma.contentItem.findFirst({
      where: {
        slug,
        ...(agencyId ? { agencyId } : {}),
      },
    });
    if (item && item.body) {
      try {
        const parsed = JSON.parse(item.body);
        if (Array.isArray(parsed)) return NextResponse.json(parsed);
      } catch {
        // body was raw string
      }
    }

    return NextResponse.json([]);
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const actor = requireContentPublishAccess(await requireAuth(request));
    const body = await request.json();
    const slug = typeof body.slug === 'string' && body.slug.trim() ? body.slug.trim() : 'about';
    const blocks = parseBlocks(body);
    const agencyId = await resolveAgencyId(actor);
    const item = await prisma.contentItem.findFirst({
      where: {
        slug,
        agencyId,
      },
    });

    let result;
    if (item) {
      result = await prisma.contentItem.update({
        where: { id: item.id },
        data: {
          body: JSON.stringify(blocks),
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      });
    } else {
      result = await prisma.contentItem.create({
        data: {
          title: slug.toUpperCase(),
          slug,
          type: 'PAGE_DOCUMENT',
          body: JSON.stringify(blocks),
          status: 'PUBLISHED',
          publishedAt: new Date(),
          authorId: actor.id,
          agencyId,
        },
      });
    }

    await writeAuditLog({
      actor,
      request,
      action: item ? 'PAGE_BLOCKS_PUBLISHED' : 'PAGE_BLOCKS_CREATED',
      entityType: 'ContentItem',
      entityId: result.id,
      metadata: {
        agencyId: result.agencyId,
        slug: result.slug,
        status: result.status,
      },
    });

    return NextResponse.json({ message: 'Saved page blocks' });
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({ message: error?.message || 'Failed' }, { status: 500 });
  }
}
