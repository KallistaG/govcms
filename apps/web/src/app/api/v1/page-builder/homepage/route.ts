import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { AuthError, AuthConfigurationError, requireAuth } from '@/lib/server-auth';
import { requireAgencyScopedAccess, requireHomepageEditAccess } from '@/lib/cms-access';

export async function GET(request: Request) {
  try {
    const actor = requireHomepageEditAccess(await requireAuth(request));
    const agencyId = requireAgencyScopedAccess(actor);
    const config = await prisma.homepageConfig.findFirst({
      where: agencyId ? { agencyId } : undefined,
      orderBy: { updatedAt: 'desc' },
    });

    if (config?.sections) {
      const sections = typeof config.sections === 'string' ? JSON.parse(config.sections) : config.sections;
      return NextResponse.json({ sections });
    }

    return NextResponse.json({
      sections: [
        {
          id: 'sec-hero-1',
          type: 'hero',
          title: '',
          subtitle: '',
          order: 0,
          isVisible: true,
          config: {},
        },
      ],
    });
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    console.error('[API_ERROR] GET /api/v1/page-builder/homepage:', error);
    return NextResponse.json({ sections: [] });
  }
}
