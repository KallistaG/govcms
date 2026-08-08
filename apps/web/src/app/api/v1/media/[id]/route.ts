import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.mediaAsset.update({
      where: { id },
      data: {
        filename: body.filename,
        altText: body.altText,
        url: body.url,
        size: body.size,
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
    await prisma.mediaAsset.delete({ where: { id } }).catch(() => {});
    return NextResponse.json({ message: 'Deleted' });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed' }, { status: 500 });
  }
}
