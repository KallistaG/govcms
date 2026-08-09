import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { getOrBootstrapAgency } from '../../../../lib/agency-bootstrap';

async function getOrCreateAgencyAndUser() {
  const agency = await getOrBootstrapAgency();
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
  return { agency, author };
}

export async function GET() {
  try {
    const config = await prisma.homepageConfig.findFirst({ orderBy: { updatedAt: 'desc' } });
    if (config?.sections) {
      const sections = typeof config.sections === 'string' ? JSON.parse(config.sections) : config.sections;
      return NextResponse.json(sections);
    }
  } catch (error) {
    console.error('[API_ERROR] GET /api/v1/homepage-config:', error);
  }

  return NextResponse.json([]);
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
      const { agency, author } = await getOrCreateAgencyAndUser();
      updated = await prisma.homepageConfig.create({
        data: {
          sections: JSON.stringify(sections),
          isDraft: true,
          agencyId: agency.id,
          authorId: author.id,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[API_ERROR] POST /api/v1/homepage-config:', error);
    return NextResponse.json({ message: error?.message || 'Failed' }, { status: 500 });
  }
}
