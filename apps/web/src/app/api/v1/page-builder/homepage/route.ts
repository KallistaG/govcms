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
      title: '',
      subtitle: '',
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
