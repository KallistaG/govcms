import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const menu = await prisma.menu.findUnique({
      where: { id },
      include: { items: { orderBy: { order: 'asc' } } },
    });
    if (menu) {
      const buildTree = (items: any[], parentId: string | null = null): any[] => {
        return items
          .filter((item) => item.parentId === parentId)
          .sort((a, b) => a.order - b.order)
          .map((item) => ({
            ...item,
            children: buildTree(items, item.id),
          }));
      };
      return NextResponse.json({ ...menu, tree: buildTree(menu.items || [], null) });
    }
  } catch {
    // fallback
  }

  return NextResponse.json({
    id,
    name: 'Main Menu',
    location: 'HEADER_MENU',
    items: [],
    tree: [],
  });
}
