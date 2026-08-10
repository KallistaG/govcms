import { NextResponse } from 'next/server';
import { MenuLocationEnum, prisma } from '@govcms/database';
import { getOrBootstrapAgency } from '@/lib/agency-bootstrap';
import { AuthError, AuthConfigurationError, requireAuth } from '@/lib/server-auth';
import { requireAgencyScopedAccess, requireMenuManageAccess } from '@/lib/cms-access';
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationInput = searchParams.get('location') || 'HEADER_MENU';

  const locUpper = locationInput.toUpperCase();
  let location: MenuLocationEnum = 'HEADER_MENU';
  if (locUpper.includes('FOOTER')) location = 'FOOTER_MENU';
  if (locUpper.includes('SIDEBAR')) location = 'SIDEBAR_MENU';

  try {
    const actor = requireMenuManageAccess(await requireAuth(request));
    const agencyId = requireAgencyScopedAccess(actor);
    let menu: any = await prisma.menu.findFirst({
      where: {
        location,
        ...(agencyId ? { agencyId } : {}),
      },
      include: { items: { orderBy: { order: 'asc' } } },
    });

    if (!menu) {
      const resolvedAgencyId = await resolveAgencyId(actor);
      menu = await prisma.menu.create({
        data: {
          name: `${location.replace('_', ' ')}`,
          code: `${location.toLowerCase()}-${Date.now()}`,
          location,
          agencyId: resolvedAgencyId,
          createdById: actor.id,
        },
        include: { items: true },
      });

      await writeAuditLog({
        actor,
        request,
        action: 'MENU_CREATED',
        entityType: 'Menu',
        entityId: menu.id,
        metadata: { agencyId: menu.agencyId, location: menu.location },
      });
    }

      const buildTree = (items: any[], parentId: string | null = null): any[] => {
      return items
        .filter((item) => item.parentId === parentId)
        .sort((a, b) => a.order - b.order)
        .map((item) => ({
          ...item,
          children: buildTree(items, item.id),
        }));
    };

    const tree = buildTree(menu.items || [], null);

    return NextResponse.json({
      id: menu.id,
      name: menu.name,
      location: menu.location,
      items: menu.items || [],
      tree,
    });
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({
      id: `menu-${location.toLowerCase()}`,
      name: location.replace('_', ' '),
      location,
      items: [],
      tree: [],
    });
  }
}
