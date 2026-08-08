import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';

export async function GET() {
  try {
    const config = await prisma.homepageConfig.findFirst({ orderBy: { updatedAt: 'desc' } });
    if (config?.sections) {
      const sections = typeof config.sections === 'string' ? JSON.parse(config.sections) : config.sections;
      return NextResponse.json(sections);
    }
  } catch {
    // fallback
  }

  return NextResponse.json([
    {
      id: 'sec-hero-1',
      type: 'hero',
      title: 'Department of Information & Communications Technology',
      subtitle: 'Official Enterprise Web Portal Engine of the Republic of the Philippines',
      order: 0,
      isVisible: true,
      config: {},
    },
    {
      id: 'sec-news-2',
      type: 'news',
      title: 'Latest Press Releases & News',
      order: 1,
      isVisible: true,
      config: {},
    },
    {
      id: 'sec-map-3',
      type: 'map',
      title: 'Central Office Location & Contact Desk',
      order: 2,
      isVisible: true,
      config: {},
    },
  ]);
}

export async function POST(request: Request) {
  try {
    const sections = await request.json();
    const existing = await prisma.homepageConfig.findFirst({ orderBy: { updatedAt: 'desc' } });

    let updated;
    if (existing) {
      updated = await prisma.homepageConfig.update({
        where: { id: existing.id },
        data: {
          sections: JSON.stringify(sections),
          isDraft: true,
        },
      });
    } else {
      const agency = await prisma.agency.findFirst();
      const author = await prisma.user.findFirst();
      updated = await prisma.homepageConfig.create({
        data: {
          sections: JSON.stringify(sections),
          isDraft: true,
          agencyId: agency?.id || 'demo-agency',
          authorId: author?.id || 'demo-author',
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed' }, { status: 500 });
  }
}
