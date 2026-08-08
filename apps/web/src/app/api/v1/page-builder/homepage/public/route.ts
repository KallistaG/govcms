import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';

export async function GET() {
  try {
    const config = await prisma.homepageConfig.findFirst({
      where: { isDraft: false },
      orderBy: { updatedAt: 'desc' },
    });
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
  ]);
}
