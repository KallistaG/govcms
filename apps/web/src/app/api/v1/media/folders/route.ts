import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { getOrBootstrapAgency } from '@/lib/agency-bootstrap';
import { AuthConfigurationError, AuthError, requireAuth } from '@/lib/server-auth';
import { requireMediaAccess } from '@/lib/cms-access';
import { writeAuditLog } from '@/lib/audit';

export const runtime = 'nodejs';

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

async function resolveAgencyId(actor: { role: string; agencyId: string | null }, requestedAgencyId?: string | null) {
  if (actor.role !== 'SUPER_ADMIN') {
    const agencyId = normalizeString(actor.agencyId);
    if (!agencyId) {
      throw new Error('Account is not assigned to an agency');
    }

    return agencyId;
  }

  const requested = normalizeString(requestedAgencyId);
  if (requested) {
    const existing = await prisma.agency.findUnique({
      where: { id: requested },
      select: { id: true },
    });

    if (existing) {
      return existing.id;
    }
  }

  const actorAgencyId = normalizeString(actor.agencyId);
  if (actorAgencyId) {
    return actorAgencyId;
  }

  const agency = await getOrBootstrapAgency();
  return agency.id;
}

export async function GET(request: Request) {
  try {
    const actor = requireMediaAccess(await requireAuth(request));
    const { searchParams } = new URL(request.url);
    const agencyId = await resolveAgencyId(actor, searchParams.get('agencyId'));

    const folders = await prisma.mediaFolder.findMany({
      where: {
        agencyId,
      },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            assets: {
              where: {
                deletedAt: null,
              },
            },
          },
        },
      },
    });

    const formatted = folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      slug: folder.slug,
      parentId: folder.parentId,
      agencyId: folder.agencyId,
      assetCount: folder._count.assets,
      createdAt: folder.createdAt.toISOString(),
      updatedAt: folder.updatedAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const actor = requireMediaAccess(await requireAuth(request));
    const body = await request.json();
    const name = normalizeString(body?.name);
    if (!name) {
      return NextResponse.json({ message: 'Folder name is required' }, { status: 400 });
    }

    const agencyId = await resolveAgencyId(actor, body?.agencyId);
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `folder-${Date.now()}`;
    const parentId = normalizeString(body?.parentId);

    if (parentId) {
      const parent = await prisma.mediaFolder.findFirst({
        where: {
          id: parentId,
          agencyId,
        },
        select: { id: true },
      });

      if (!parent) {
        return NextResponse.json({ message: 'Parent folder not found' }, { status: 404 });
      }
    }

    const folder = await prisma.mediaFolder.create({
      data: {
        name,
        slug,
        parentId,
        agencyId,
        createdById: actor.id,
      },
    });

    await writeAuditLog({
      actor,
      request,
      action: 'MEDIA_FOLDER_CREATED',
      entityType: 'MediaFolder',
      entityId: folder.id,
      metadata: {
        agencyId,
        parentId: folder.parentId,
      },
    });

    return NextResponse.json({
      id: folder.id,
      name: folder.name,
      slug: folder.slug,
      parentId: folder.parentId,
      agencyId: folder.agencyId,
      createdAt: folder.createdAt.toISOString(),
      updatedAt: folder.updatedAt.toISOString(),
    });
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({ message: error?.message || 'Failed to create folder' }, { status: 500 });
  }
}
