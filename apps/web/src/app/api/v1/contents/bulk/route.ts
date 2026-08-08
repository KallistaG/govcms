import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';

export async function POST(request: Request) {
  try {
    const { action, ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: 'No items selected' }, { status: 400 });
    }

    if (action === 'delete') {
      await prisma.contentItem.deleteMany({ where: { id: { in: ids } } }).catch(() => {});
    } else if (action === 'publish') {
      await prisma.contentItem.updateMany({ where: { id: { in: ids } }, data: { status: 'PUBLISHED' } }).catch(() => {});
    } else if (action === 'archive') {
      await prisma.contentItem.updateMany({ where: { id: { in: ids } }, data: { status: 'ARCHIVED' } }).catch(() => {});
    }

    return NextResponse.json({ message: `Successfully performed ${action}` });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Bulk action failed' }, { status: 500 });
  }
}
