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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireMenuManageAccess(await requireAuth(request));
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const agencyId = requireAgencyScopedAccess(actor);

    const menuItem = await prisma.menuItem.findFirst({
      where: {
        id,
        menu: agencyId ? { agencyId } : undefined,
      },
      include: { menu: { select: { id: true, agencyId: true } } },
    });

    if (!menuItem) {
      return NextResponse.json({ message: 'Menu item not found' }, { status: 404 });
    }

    const nextMenuId = typeof body.menuId === 'string' && body.menuId.trim() ? body.menuId.trim() : menuItem.menuId;
    if (nextMenuId !== menuItem.menuId) {
      const targetMenu = await prisma.menu.findFirst({
        where: {
          id: nextMenuId,
          ...(agencyId ? { agencyId } : {}),
        },
        select: { id: true, agencyId: true },
      });

      if (!targetMenu) {
        return NextResponse.json({ message: 'Target menu not found' }, { status: 404 });
      }
    }

    const parentId = typeof body.parentId === 'string' && body.parentId.trim() ? body.parentId.trim() : null;
    if (parentId) {
      const parent = await prisma.menuItem.findFirst({
        where: {
          id: parentId,
          menuId: nextMenuId,
        },
        select: { id: true },
      });

      if (!parent) {
        return NextResponse.json({ message: 'Parent menu item not found' }, { status: 400 });
      }
    }

    const updated = await prisma.menuItem.update({
      where: { id: menuItem.id },
      data: {
        menuId: nextMenuId,
        title: typeof body.title === 'string' ? body.title.trim() : menuItem.title,
        url: typeof body.url === 'string' ? body.url.trim() : menuItem.url,
        icon: typeof body.icon === 'string' ? body.icon : menuItem.icon,
        order: toNumber(body.order, menuItem.order),
        isExternal: body.isExternal === undefined ? menuItem.isExternal : toBoolean(body.isExternal, menuItem.isExternal),
        openInNewTab: body.openInNewTab === undefined ? menuItem.openInNewTab : toBoolean(body.openInNewTab, menuItem.openInNewTab),
        isVisible: body.isVisible === undefined ? menuItem.isVisible : toBoolean(body.isVisible, menuItem.isVisible),
        parentId,
      },
    });

    await writeAuditLog({
      actor,
      request,
      action: 'MENU_ITEM_UPDATED',
      entityType: 'MenuItem',
      entityId: updated.id,
      metadata: {
        agencyId: menuItem.menu.agencyId,
        menuId: updated.menuId,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({ message: error?.message || 'Failed' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireMenuManageAccess(await requireAuth(request));
    const { id } = await params;
    const agencyId = requireAgencyScopedAccess(actor);
    const menuItem = await prisma.menuItem.findFirst({
      where: {
        id,
        menu: agencyId ? { agencyId } : undefined,
      },
      include: { menu: { select: { id: true, agencyId: true } } },
    });

    if (!menuItem) {
      return NextResponse.json({ message: 'Menu item not found' }, { status: 404 });
    }

    await prisma.menuItem.delete({ where: { id: menuItem.id } }).catch(() => {});
    await writeAuditLog({
      actor,
      request,
      action: 'MENU_ITEM_DELETED',
      entityType: 'MenuItem',
      entityId: menuItem.id,
      metadata: {
        agencyId: menuItem.menu.agencyId,
        menuId: menuItem.menuId,
      },
    });

    return NextResponse.json({ message: 'Deleted' });
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({ message: error?.message || 'Failed' }, { status: 500 });
  }
}
