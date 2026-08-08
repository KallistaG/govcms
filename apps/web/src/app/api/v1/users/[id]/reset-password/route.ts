import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import bcrypt from 'bcrypt';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tempPassword = 'Password123!';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { passwordHash: hashedPassword },
    });

    return NextResponse.json({ message: 'Password reset to temporary password' });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed' }, { status: 500 });
  }
}
