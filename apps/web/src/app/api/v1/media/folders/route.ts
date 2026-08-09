import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { getOrBootstrapAgency } from '../../../../../lib/agency-bootstrap';

export async function GET() {
  try {
    const folders = await prisma.mediaFolder.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { assets: true } } },
    });
    const formatted = folders.map((f) => ({
      id: f.id,
      name: f.name,
      parentId: f.parentId,
      assetCount: f._count.assets,
      createdAt: f.createdAt,
    }));
    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const { name, parentId } = await request.json();
    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : `folder-${Date.now()}`;

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

    const folder = await prisma.mediaFolder.create({
      data: {
        name,
        slug,
        parentId: parentId || null,
        agencyId: agency.id,
        createdById: user.id,
      },
    });
    return NextResponse.json(folder);
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed to create folder' }, { status: 500 });
  }
}
