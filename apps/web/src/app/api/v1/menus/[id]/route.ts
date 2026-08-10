import { NextResponse } from 'next/server';
import { MenuLocationEnum, prisma } from '@govcms/database';
import { AuthError, AuthConfigurationError, requireAuth } from '@/lib/server-auth';
import { requireAgencyScopedAccess, requireMenuManageAccess } from '@/lib/cms-access';
import { writeAuditLog } from '@/lib/audit';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = requireMenuManageAccess(await requireAuth(request));
    const { id } = await params;
    const agencyId = requireAgencyScopedAccess(actor);
    const menu = await prisma.menu.findFirst({
      where: {
        id,
        ...(agencyId ? { agencyId } : {}),
      },
      include: { items: { orderBy: { order: 'asc' } } },
    });
    if (menu) {
      const buildTree = (items: any[], parentId: string | null = null): any[] => {
        return items
          .filter((item) => item.parentId === parentId)
          .sort((a, b) => a.order - b.order)
          .map((item) => ({
            ...item,
            children: buildTree(items, item.id),
          }));
      };
      return NextResponse.json({ ...menu, tree: buildTree(menu.items || [], null) });
    }

    return NextResponse.json({ message: 'Menu not found' }, { status: 404 });
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({ message: error?.message || 'Menu not found' }, { status: 404 });
  }
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

    const existing = await prisma.menu.findFirst({
      where: {
        id,
        ...(agencyId ? { agencyId } : {}),
      },
    });

    if (!existing) {
      return NextResponse.json({ message: 'Menu not found' }, { status: 404 });
    }

    const updated = await prisma.menu.update({
      where: { id: existing.id },
      data: {
        name: typeof body.name === 'string' ? body.name : existing.name,
        code: typeof body.code === 'string' ? body.code : existing.code,
        location: typeof body.location === 'string' ? (body.location as MenuLocationEnum) : existing.location,
      },
    });

    await writeAuditLog({
      actor,
      request,
      action: 'MENU_UPDATED',
      entityType: 'Menu',
      entityId: updated.id,
      metadata: {
        agencyId: updated.agencyId,
        location: updated.location,
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
    const menu = await prisma.menu.findFirst({
      where: {
        id,
        ...(agencyId ? { agencyId } : {}),
      },
    });

    if (!menu) {
      return NextResponse.json({ message: 'Menu not found' }, { status: 404 });
    }

    await prisma.menu.delete({ where: { id: menu.id } }).catch(() => {});
    await writeAuditLog({
      actor,
      request,
      action: 'MENU_DELETED',
      entityType: 'Menu',
      entityId: menu.id,
      metadata: {
        agencyId: menu.agencyId,
        location: menu.location,
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
