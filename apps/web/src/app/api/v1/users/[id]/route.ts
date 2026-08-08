import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import bcrypt from 'bcrypt';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const dataToUpdate: any = {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      role: body.role,
      department: body.department,
      phone: body.phone,
      avatarUrl: body.avatarUrl,
      permissions: body.permissions,
    };

    if (body.password) {
      dataToUpdate.passwordHash = await bcrypt.hash(body.password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
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
    await prisma.user.delete({ where: { id } }).catch(() => {});
    return NextResponse.json({ message: 'Deleted' });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed' }, { status: 500 });
  }
}
