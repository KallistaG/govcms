import { NextResponse } from 'next/server';
import { prisma, getWebsiteSettings } from '@govcms/database';
import { getOrBootstrapAgency } from '@/lib/agency-bootstrap';
import { AuthError, AuthConfigurationError, requireAuth } from '@/lib/server-auth';
import { getScopedAgencyId, requireSettingsAccess } from '@/lib/admin-rbac';
import { writeAuditLog } from '@/lib/audit';

async function resolveAgencyId(actorAgencyId?: string | null): Promise<string> {
  if (actorAgencyId) {
    return actorAgencyId;
  }

  const agency = await getOrBootstrapAgency();
  return agency.id;
}

export async function GET(request: Request) {
  try {
    const actor = requireSettingsAccess(await requireAuth(request));
    const agencyId = getScopedAgencyId(actor);
    let theme = await prisma.themeConfig.findFirst({
      where: agencyId ? { agencyId } : undefined,
      orderBy: { updatedAt: 'desc' },
    });

    if (!theme) {
      const settings = await getWebsiteSettings();
      const resolvedAgencyId = await resolveAgencyId(actor.agencyId);
      theme = await prisma.themeConfig.create({
        data: {
          websiteName: settings.siteName || 'Government Agency Portal',
          primaryColor: settings.primaryColor || '#1d4ed8',
          secondaryColor: settings.secondaryColor || '#7c3aed',
          fontHeading: 'Inter',
          fontBody: 'Inter',
          isActive: true,
          agencyId: resolvedAgencyId,
          authorId: actor.id,
        },
      });
    }

    return NextResponse.json(theme);
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    console.error('[API_ERROR] GET /api/v1/theme:', error);
    return NextResponse.json({
      primaryColor: '#1d4ed8',
      secondaryColor: '#7c3aed',
      fontHeading: 'Inter',
      fontBody: 'Inter',
      isActive: true,
    });
  }
}

export async function POST(request: Request) {
  try {
    const actor = requireSettingsAccess(await requireAuth(request));
    const body = (await request.json()) as Record<string, unknown>;
    const agencyId = getScopedAgencyId(actor);
    const existing = await prisma.themeConfig.findFirst({
      where: agencyId ? { agencyId } : undefined,
      orderBy: { updatedAt: 'desc' },
    });

    let updated;
    if (existing) {
      updated = await prisma.themeConfig.update({
        where: { id: existing.id },
        data: {
          primaryColor: typeof body.primaryColor === 'string' ? body.primaryColor : existing.primaryColor,
          secondaryColor: typeof body.secondaryColor === 'string' ? body.secondaryColor : existing.secondaryColor,
          fontHeading: typeof body.fontHeading === 'string' ? body.fontHeading : existing.fontHeading,
          fontBody: typeof body.fontBody === 'string' ? body.fontBody : existing.fontBody,
        },
      });
    } else {
      const settings = await getWebsiteSettings();
      const resolvedAgencyId = await resolveAgencyId(actor.agencyId);
      updated = await prisma.themeConfig.create({
        data: {
          websiteName: settings.siteName || 'Government Agency Portal',
          primaryColor: typeof body.primaryColor === 'string' ? body.primaryColor : settings.primaryColor || '#1d4ed8',
          secondaryColor: typeof body.secondaryColor === 'string' ? body.secondaryColor : settings.secondaryColor || '#7c3aed',
          fontHeading: typeof body.fontHeading === 'string' ? body.fontHeading : 'Inter',
          fontBody: typeof body.fontBody === 'string' ? body.fontBody : 'Inter',
          isActive: true,
          agencyId: resolvedAgencyId,
          authorId: actor.id,
        },
      });
    }

    await writeAuditLog({
      actor,
      request,
      action: 'THEME_CHANGED',
      entityType: 'ThemeConfig',
      entityId: updated.id,
      metadata: {
        agencyId: updated.agencyId,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    console.error('[API_ERROR] POST /api/v1/theme:', error);
    return NextResponse.json({ message: error?.message || 'Failed to update theme' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return POST(request);
}
