import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { getOrBootstrapAgency } from '@/lib/agency-bootstrap';
import { AuthError, AuthConfigurationError, requireAuth } from '@/lib/server-auth';
import { requireAgencyScopedAccess, requireHomepageEditAccess } from '@/lib/cms-access';
import { writeAuditLog } from '@/lib/audit';

function normalizeSections(body: unknown): string {
  const sections = Array.isArray(body) ? body : (body as { sections?: unknown } | null)?.sections;
  return JSON.stringify(Array.isArray(sections) ? sections : []);
}

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

export async function POST(request: Request) {
  try {
    const actor = requireHomepageEditAccess(await requireAuth(request));
    const body = await request.json();
    const agencyId = requireAgencyScopedAccess(actor);
    const existing = await prisma.homepageConfig.findFirst({
      where: agencyId ? { agencyId } : undefined,
      orderBy: { updatedAt: 'desc' },
    });

    let updated;
    if (existing) {
      updated = await prisma.homepageConfig.update({
        where: { id: existing.id },
        data: {
          sections: normalizeSections(body),
          isDraft: true,
        },
      });
    } else {
      const resolvedAgencyId = await resolveAgencyId(actor);
      updated = await prisma.homepageConfig.create({
        data: {
          sections: normalizeSections(body),
          isDraft: true,
          agencyId: resolvedAgencyId,
          authorId: actor.id,
        },
      });
    }

    await writeAuditLog({
      actor,
      request,
      action: 'HOMEPAGE_DRAFT_SAVED',
      entityType: 'HomepageConfig',
      entityId: updated.id,
      metadata: {
        agencyId: updated.agencyId,
        isDraft: updated.isDraft,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    console.error('[API_ERROR] POST /api/v1/page-builder/homepage/sections:', error);
    return NextResponse.json({ message: error?.message || 'Failed to update sections' }, { status: 500 });
  }
}
