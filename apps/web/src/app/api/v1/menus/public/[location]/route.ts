import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ location: string }> }
) {
  const { location: locationInput } = await params;
  const locUpper = (locationInput || 'HEADER_MENU').toUpperCase();
  let location: any = 'HEADER_MENU';
  if (locUpper.includes('FOOTER')) location = 'FOOTER_MENU';
  if (locUpper.includes('SIDEBAR')) location = 'SIDEBAR_MENU';

  try {
    const menu = await prisma.menu.findFirst({
      where: { location },
      include: { items: { orderBy: { order: 'asc' } } },
    });

    if (menu) {
      const buildTree = (items: any[], parentId: string | null = null): any[] => {
        return items
          .filter((item) => item.parentId === parentId && item.isVisible)
          .sort((a, b) => a.order - b.order)
          .map((item) => ({
            ...item,
            children: buildTree(items, item.id),
          }));
      };

      const tree = buildTree(menu.items || [], null);
      return NextResponse.json({
        id: menu.id,
        name: menu.name,
        location: menu.location,
        items: menu.items || [],
        tree,
      });
    }
  } catch {
    // fallback
  }

  return NextResponse.json({
    id: 'menu-demo',
    name: 'Header Navigation',
    location,
    items: [],
    tree: [
      { id: '1', title: 'Home', url: '/', order: 0 },
      { id: '2', title: 'About Us', url: '/pages/about', order: 1 },
      { id: '3', title: 'Press Releases', url: '/news', order: 2 },
      { id: '4', title: 'Public Downloads', url: '/downloads', order: 3 },
    ],
  });
}
