import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') || 'about';

  try {
    const item = await prisma.contentItem.findFirst({ where: { slug } });
    if (item && item.body) {
      try {
        const parsed = JSON.parse(item.body);
        if (Array.isArray(parsed)) return NextResponse.json(parsed);
      } catch {
        // body was HTML string
      }
    }
  } catch {
    // fallback
  }

  return NextResponse.json([
    {
      id: `blk-text-1`,
      type: 'text',
      order: 0,
      config: { text: `Official Agency Mandate and Overview for ${slug}` },
    },
  ]);
}

export async function POST(request: Request) {
  try {
    const { slug, blocks } = await request.json();
    const item = await prisma.contentItem.findFirst({ where: { slug } });

    if (item) {
      await prisma.contentItem.update({
        where: { id: item.id },
        data: { body: JSON.stringify(blocks) },
      });
    } else {
      const author = await prisma.user.findFirst();
      const agency = await prisma.agency.findFirst();
      await prisma.contentItem.create({
        data: {
          title: slug.toUpperCase(),
          slug,
          type: 'PAGE_DOCUMENT',
          body: JSON.stringify(blocks),
          status: 'PUBLISHED',
          authorId: author?.id || 'demo-author',
          agencyId: agency?.id || 'demo-agency',
        },
      });
    }

    return NextResponse.json({ message: 'Saved page blocks' });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed' }, { status: 500 });
  }
}
