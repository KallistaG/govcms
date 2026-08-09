import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { getOrBootstrapAgency } from '../../../../lib/agency-bootstrap';

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
        totalPages: Math.ceil(total / limit) || 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      data: [],
      meta: { page: 1, limit, total: 0, totalPages: 0 },
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const slug = body.slug || body.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `item-${Date.now()}`;

    let author = await prisma.user.findFirst();
    if (!author) {
      author = await prisma.user.create({
        data: {
          email: 'admin@gov.ph',
          passwordHash: '',
          firstName: 'Agency',
          lastName: 'Administrator',
          role: 'ADMINISTRATOR',
        },
      });
    }

    const agency = await getOrBootstrapAgency();

    const created = await prisma.contentItem.create({
      data: {
        title: body.title,
        slug,
        type: body.type || 'PAGE_DOCUMENT',
        body: body.body || '',
        summary: body.summary || '',
        status: body.isPublished || body.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
        authorId: author.id,
        agencyId: agency.id,
      },
    });

    return NextResponse.json({ ...created, isPublished: created.status === 'PUBLISHED' });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed to create content' }, { status: 500 });
  }
}
