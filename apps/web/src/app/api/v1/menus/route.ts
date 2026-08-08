import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locationInput = searchParams.get('location') || 'HEADER_MENU';

  const locUpper = locationInput.toUpperCase();
  let location: any = 'HEADER_MENU';
  if (locUpper.includes('FOOTER')) location = 'FOOTER_MENU';
  if (locUpper.includes('SIDEBAR')) location = 'SIDEBAR_MENU';

  try {
    let menu = await prisma.menu.findFirst({
      where: { location },
      include: { items: { orderBy: { order: 'asc' } } },
    });

    if (!menu) {
      const agency = await prisma.agency.findFirst();
      const user = await prisma.user.findFirst();
      menu = await prisma.menu.create({
        data: {
          name: `${location} Navigation`,
          code: `${location.toLowerCase()}-${Date.now()}`,
          location,
          agencyId: agency?.id || 'demo-agency',
          createdById: user?.id || 'demo-user',
        },
        include: { items: true },
      });
    }

    const buildTree = (items: any[], parentId: string | null = null): any[] => {
      return items
        .filter((item) => item.parentId === parentId)
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
  } catch {
    return NextResponse.json({
      id: 'menu-demo',
      name: 'Header Menu',
      location,
      items: [],
      tree: [],
    });
  }
}
