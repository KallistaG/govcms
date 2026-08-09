import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { getOrBootstrapAgency } from '@/lib/agency-bootstrap';
import { AuthError, AuthConfigurationError, requireAuth } from '@/lib/server-auth';
import { requireAgencyScopedAccess, requireHomepageEditAccess } from '@/lib/cms-access';
import { writeAuditLog } from '@/lib/audit';

function normalizeSections(sections: unknown): string {
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

export async function GET(request: Request) {
  try {
    const actor = requireHomepageEditAccess(await requireAuth(request));
    const agencyId = requireAgencyScopedAccess(actor);
    const config = await prisma.homepageConfig.findFirst({
      where: agencyId ? { agencyId } : undefined,
      orderBy: { updatedAt: 'desc' },
    });
    if (config?.sections) {
      const sections = typeof config.sections === 'string' ? JSON.parse(config.sections) : config.sections;
      return NextResponse.json(sections);
    }

    return NextResponse.json([]);
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    console.error('[API_ERROR] GET /api/v1/homepage-config:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const actor = requireHomepageEditAccess(await requireAuth(request));
    const sections = await request.json();
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
          sections: normalizeSections(sections),
          isDraft: true,
        },
      });
    } else {
      const resolvedAgencyId = await resolveAgencyId(actor);
      updated = await prisma.homepageConfig.create({
        data: {
          sections: normalizeSections(sections),
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

    console.error('[API_ERROR] POST /api/v1/homepage-config:', error);
    return NextResponse.json({ message: error?.message || 'Failed' }, { status: 500 });
  }
}
