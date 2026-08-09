import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { getOrBootstrapAgency } from '@/lib/agency-bootstrap';

async function getOrCreateAgencyAndUser() {
  const agency = await getOrBootstrapAgency();
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'admin@gov.ph',
        passwordHash: '',
        firstName: 'Agency',
        lastName: 'Administrator',
        role: 'ADMINISTRATOR',
      },
    });
  }
  return { agency, user };
}

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
      const { agency, user } = await getOrCreateAgencyAndUser();
      menu = await prisma.menu.create({
        data: {
          name: `${location.replace('_', ' ')}`,
          code: `${location.toLowerCase()}-${Date.now()}`,
          location,
          agencyId: agency.id,
          createdById: user.id,
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
      id: `menu-${location.toLowerCase()}`,
      name: location.replace('_', ' '),
      location,
      items: [],
      tree: [],
    });
  }
}
