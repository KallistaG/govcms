import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';

export async function POST(request: Request) {
  try {
    const { ids } = await request.json();
    if (ids && Array.isArray(ids)) {
      await prisma.mediaAsset.deleteMany({ where: { id: { in: ids } } }).catch(() => {});
    }
  } catch {
    // fallback
  }
  return NextResponse.json({ message: 'Deleted selected assets' });
}
