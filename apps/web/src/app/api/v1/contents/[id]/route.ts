import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await prisma.contentItem.findUnique({
      where: { id },
      include: { author: { select: { firstName: true, lastName: true, email: true } } },
    });
    if (item) return NextResponse.json({ ...item, isPublished: item.status === 'PUBLISHED' });
    return NextResponse.json({ message: 'Content item not found' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Content item not found' }, { status: 404 });
  }
}

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
    return NextResponse.json({ message: error?.message || 'Failed to update content item' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return PUT(request, context);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.contentItem.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted content item successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed to delete content item' }, { status: 500 });
  }
}
