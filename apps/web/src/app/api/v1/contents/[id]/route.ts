import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.contentItem.update({
      where: { id },
      data: {
        title: body.title,
        type: body.type,
        body: body.body,
        summary: body.summary,
        status: body.isPublished || body.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
      },
    });

    return NextResponse.json({ ...updated, isPublished: updated.status === 'PUBLISHED' });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.contentItem.delete({ where: { id } }).catch(() => {});
    return NextResponse.json({ message: 'Deleted' });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed to delete' }, { status: 500 });
  }
}
