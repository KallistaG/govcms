import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';

export async function POST() {
  try {
    const existing = await prisma.themeConfig.findFirst({ orderBy: { updatedAt: 'desc' } });
    if (existing) {
      await prisma.themeConfig.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
    }
    return NextResponse.json({ message: 'Theme published' });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed' }, { status: 500 });
  }
}
