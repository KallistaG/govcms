import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { AuthError, AuthConfigurationError, requireAuth } from '@/lib/server-auth';
import { getScopedAgencyId, requireSettingsAccess } from '@/lib/admin-rbac';
import { writeAuditLog } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const actor = requireSettingsAccess(await requireAuth(request));
    const agencyId = getScopedAgencyId(actor);
    const existing = await prisma.themeConfig.findFirst({
      where: agencyId ? { agencyId } : undefined,
      orderBy: { updatedAt: 'desc' },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Theme config not found' }, { status: 404 });
    }

    const published = await prisma.themeConfig.update({
      where: { id: existing.id },
      data: { isActive: true },
    });

    await writeAuditLog({
      actor,
      request,
      action: 'THEME_CONFIG_PUBLISHED',
      entityType: 'ThemeConfig',
      entityId: published.id,
      metadata: { agencyId: published.agencyId },
    });

    return NextResponse.json({ message: 'Theme published' });
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({ message: error?.message || 'Failed' }, { status: 500 });
  }
}
