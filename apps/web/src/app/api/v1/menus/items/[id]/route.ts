import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        title: body.title,
        url: body.url,
        icon: body.icon,
        order: body.order,
        isExternal: body.isExternal,
        openInNewTab: body.openInNewTab,
        isVisible: body.isVisible,
        parentId: body.parentId,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.menuItem.delete({ where: { id } }).catch(() => {});
    return NextResponse.json({ message: 'Deleted' });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed' }, { status: 500 });
  }
}
