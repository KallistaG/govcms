import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();
    if (!newPassword) {
      return NextResponse.json({ message: 'Password is required' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await prisma.user.findFirst();
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: hashedPassword },
      });
    }

    return NextResponse.json({ message: 'Password successfully updated' });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed to update password' }, { status: 500 });
  }
}
