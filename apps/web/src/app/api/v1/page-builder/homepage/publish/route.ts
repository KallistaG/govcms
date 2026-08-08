import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';

async function getOrCreateAgencyAndUser() {
  let agency = await prisma.agency.findFirst();
  if (!agency) {
    agency = await prisma.agency.create({
      data: { name: 'La Carlota City Water District', code: 'LCCWD', slug: 'lccwd' },
    });
  }
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
    const body = await request.json().catch(() => null);
    const sectionsInput = body && Array.isArray(body) ? body : body?.sections;
    const existing = await prisma.homepageConfig.findFirst({ orderBy: { updatedAt: 'desc' } });

    if (existing) {
      await prisma.homepageConfig.update({
        where: { id: existing.id },
        data: {
          sections: sectionsInput && Array.isArray(sectionsInput) ? JSON.stringify(sectionsInput) : (existing.sections as any),
          isDraft: false,
        },
      });
    } else if (sectionsInput && Array.isArray(sectionsInput)) {
      const { agency, author } = await getOrCreateAgencyAndUser();
      await prisma.homepageConfig.create({
        data: {
          sections: JSON.stringify(sectionsInput),
          isDraft: false,
          agencyId: agency.id,
          authorId: author.id,
        },
      });
    }
    return NextResponse.json({ message: 'Homepage published successfully' });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed to publish homepage' }, { status: 500 });
  }
}
