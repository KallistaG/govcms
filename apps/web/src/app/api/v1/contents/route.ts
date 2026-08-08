import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const type = searchParams.get('type') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  const where: any = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { summary: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (status) {
    if (status === 'PUBLISHED') where.status = 'PUBLISHED';
    if (status === 'DRAFT') where.status = 'DRAFT';
  }
  if (type) {
    where.type = type;
  }

  try {
    const total = await prisma.contentItem.count({ where });
    const data = await prisma.contentItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { author: { select: { firstName: true, lastName: true, email: true } } },
    });

    const formatted = data.map((item) => ({
      ...item,
      isPublished: item.status === 'PUBLISHED',
    }));

    return NextResponse.json({
      data: formatted,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch {
    return NextResponse.json({
      data: [
        {
          id: 'cnt-1',
          title: 'DICT Launches Enterprise Cloud Infrastructure for Regional Government Units',
          slug: 'dict-launches-enterprise-cloud-infrastructure',
          type: 'PRESS_RELEASE',
          status: 'PUBLISHED',
          isPublished: true,
          summary: 'Accelerating digital transformation across local government units with secure cloud hosting services.',
          createdAt: new Date().toISOString(),
          author: { firstName: 'Maria', lastName: 'Santos', email: 'maria.santos@dict.gov.ph' },
        },
      ],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const slug = body.slug || body.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `item-${Date.now()}`;

    const author = await prisma.user.findFirst();
    const agency = await prisma.agency.findFirst();

    const created = await prisma.contentItem.create({
      data: {
        title: body.title,
        slug,
        type: body.type || 'PAGE_DOCUMENT',
        body: body.body || '',
        summary: body.summary || '',
        status: body.isPublished || body.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
        authorId: author?.id || 'demo-author',
        agencyId: agency?.id || 'demo-agency',
      },
    });

    return NextResponse.json({ ...created, isPublished: created.status === 'PUBLISHED' });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed to create content' }, { status: 500 });
  }
}
