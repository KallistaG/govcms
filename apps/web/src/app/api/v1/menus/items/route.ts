import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const created = await prisma.menuItem.create({
      data: {
        menuId: body.menuId,
        title: body.title,
        url: body.url,
        icon: body.icon || 'Link',
        order: body.order || 0,
        isExternal: body.isExternal || false,
        openInNewTab: body.openInNewTab || false,
        isVisible: body.isVisible ?? true,
        parentId: body.parentId || null,
      },
    });

    return NextResponse.json(created);
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed' }, { status: 500 });
  }
}
