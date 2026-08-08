import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { isActive } = await request.json();

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed' }, { status: 500 });
  }
}
