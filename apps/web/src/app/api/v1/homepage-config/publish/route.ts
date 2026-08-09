import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { getOrBootstrapAgency } from '@/lib/agency-bootstrap';
import { AuthError, AuthConfigurationError, requireAuth } from '@/lib/server-auth';
import { requireAgencyScopedAccess, requireHomepagePublishAccess } from '@/lib/cms-access';
import { writeAuditLog } from '@/lib/audit';

function normalizeSections(sections: unknown): string | null {
  return Array.isArray(sections) ? JSON.stringify(sections) : null;
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
    const actor = requireHomepagePublishAccess(await requireAuth(request));
    const body = (await request.json().catch(() => null)) as unknown;
    const rawSections = Array.isArray(body) ? body : (body as { sections?: unknown } | null)?.sections;
    const sections = normalizeSections(rawSections);
    const agencyId = requireAgencyScopedAccess(actor);
    const existing = await prisma.homepageConfig.findFirst({
      where: agencyId ? { agencyId } : undefined,
      orderBy: { updatedAt: 'desc' },
    });

    let published;
    if (existing) {
      published = await prisma.homepageConfig.update({
        where: { id: existing.id },
        data: {
          sections: sections ?? (existing.sections as any),
          isDraft: false,
          publishedAt: new Date(),
        },
      });
    } else if (sections) {
      const resolvedAgencyId = await resolveAgencyId(actor);
      published = await prisma.homepageConfig.create({
        data: {
          sections,
          isDraft: false,
          publishedAt: new Date(),
          agencyId: resolvedAgencyId,
          authorId: actor.id,
        },
      });
    }

    if (!published) {
      return NextResponse.json({ message: 'No homepage draft to publish' }, { status: 404 });
    }

    await writeAuditLog({
      actor,
      request,
      action: 'HOMEPAGE_PUBLISHED',
      entityType: 'HomepageConfig',
      entityId: published.id,
      metadata: {
        agencyId: published.agencyId,
        isDraft: published.isDraft,
      },
    });

    return NextResponse.json({ message: 'Homepage published live' });
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    console.error('[API_ERROR] POST /api/v1/homepage-config/publish:', error);
    return NextResponse.json({ message: error?.message || 'Failed' }, { status: 500 });
  }
}
