import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { getOrBootstrapAgency } from '../../../../../lib/agency-bootstrap';

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sections = Array.isArray(body) ? body : body.sections || [];
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
    console.error('[API_ERROR] POST /api/v1/page-builder/homepage/sections:', error);
    return NextResponse.json({ message: error?.message || 'Failed to update sections' }, { status: 500 });
  }
}
