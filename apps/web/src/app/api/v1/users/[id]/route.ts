import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import bcrypt from 'bcrypt';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'User not found' }, { status: 404 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const dataToUpdate: any = {};
    if (body.firstName !== undefined) dataToUpdate.firstName = body.firstName;
    if (body.lastName !== undefined) dataToUpdate.lastName = body.lastName;
    if (body.email !== undefined) dataToUpdate.email = body.email;
    if (body.role !== undefined) dataToUpdate.role = body.role;
    if (body.department !== undefined) dataToUpdate.department = body.department;
    if (body.phone !== undefined) dataToUpdate.phone = body.phone;
    if (body.avatarUrl !== undefined) dataToUpdate.avatarUrl = body.avatarUrl;
    if (body.permissions !== undefined) dataToUpdate.permissions = body.permissions;
    if (body.isActive !== undefined) dataToUpdate.isActive = Boolean(body.isActive);

    if (body.password) {
      dataToUpdate.passwordHash = await bcrypt.hash(body.password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed to delete user' }, { status: 500 });
  }
}
