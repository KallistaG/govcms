import { NextResponse } from 'next/server';
import { prisma, getWebsiteSettings } from '@govcms/database';

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

    const settings = await getWebsiteSettings();

    return NextResponse.json([
      {
        id: 'sec-hero-1',
        type: 'hero',
        title: settings.siteName || 'La Carlota City Water District',
        subtitle: settings.tagline || 'Providing safe, adequate, safe and potable water supply affordable to all.',
        order: 0,
        isVisible: true,
        config: {},
      },
    ]);
  } catch (error) {
    console.error('[API_ERROR] GET /api/v1/page-builder/homepage/public:', error);
    return NextResponse.json(
      { message: 'Failed to retrieve published homepage sections' },
      { status: 500 }
    );
  }
}
