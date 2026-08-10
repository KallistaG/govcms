import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { getOrBootstrapAgency } from '@/lib/agency-bootstrap';
import { AuthError, AuthConfigurationError, requireAuth } from '@/lib/server-auth';
import { requireAgencyScopedAccess, requireHomepagePublishAccess } from '@/lib/cms-access';
import { writeAuditLog } from '@/lib/audit';

function normalizeSections(body: unknown): string | null {
  const sections = Array.isArray(body) ? body : (body as { sections?: unknown } | null)?.sections;
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
    const body = await request.json().catch(() => null);
    const sectionsInput = normalizeSections(body);
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
          sections: sectionsInput ?? (existing.sections as any),
          isDraft: false,
          publishedAt: new Date(),
        },
      });
    } else if (sectionsInput) {
      const resolvedAgencyId = await resolveAgencyId(actor);
      published = await prisma.homepageConfig.create({
        data: {
          sections: sectionsInput,
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

    return NextResponse.json({ message: 'Homepage published successfully' });
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    console.error('[API_ERROR] POST /api/v1/page-builder/homepage/publish:', error);
    return NextResponse.json({ message: error?.message || 'Failed to publish homepage' }, { status: 500 });
  }
}
