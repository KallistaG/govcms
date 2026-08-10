import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { AuthError, AuthConfigurationError, requireAuth } from '@/lib/server-auth';
import { requireAgencyScopedAccess, requireMenuManageAccess } from '@/lib/cms-access';
import { writeAuditLog } from '@/lib/audit';

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  return fallback;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

export async function POST(request: Request) {
  try {
    const actor = requireMenuManageAccess(await requireAuth(request));
    const body = (await request.json()) as Record<string, unknown>;
    const menuId = typeof body.menuId === 'string' ? body.menuId.trim() : '';
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const url = typeof body.url === 'string' ? body.url.trim() : '';

    if (!menuId || !title || !url) {
      return NextResponse.json({ message: 'menuId, title, and url are required' }, { status: 400 });
    }

    const agencyId = requireAgencyScopedAccess(actor);
    const menu = await prisma.menu.findFirst({
      where: {
        id: menuId,
        ...(agencyId ? { agencyId } : {}),
      },
      select: { id: true, agencyId: true },
    });

    if (!menu) {
      return NextResponse.json({ message: 'Menu not found' }, { status: 404 });
    }

    const parentId = typeof body.parentId === 'string' && body.parentId.trim() ? body.parentId.trim() : null;
    if (parentId) {
      const parent = await prisma.menuItem.findFirst({
        where: { id: parentId, menuId: menu.id },
        select: { id: true },
      });

      if (!parent) {
        return NextResponse.json({ message: 'Parent menu item not found' }, { status: 400 });
      }
    }

    const created = await prisma.menuItem.create({
      data: {
        menuId: menu.id,
        title,
        url,
        icon: typeof body.icon === 'string' && body.icon.trim() ? body.icon.trim() : 'Link',
        order: toNumber(body.order, 0),
        isExternal: toBoolean(body.isExternal, false),
        openInNewTab: toBoolean(body.openInNewTab, false),
        isVisible: body.isVisible === undefined ? true : toBoolean(body.isVisible, true),
        parentId,
      },
    });

    await writeAuditLog({
      actor,
      request,
      action: 'MENU_ITEM_CREATED',
      entityType: 'MenuItem',
      entityId: created.id,
      metadata: {
        agencyId: menu.agencyId,
        menuId: menu.id,
      },
    });

    return NextResponse.json(created);
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({ message: error?.message || 'Failed' }, { status: 500 });
  }
}
