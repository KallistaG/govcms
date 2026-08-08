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
        // body was raw string
      }
    }
  } catch {
    // fallback
  }

  return NextResponse.json([]);
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
      const { agency, author } = await getOrCreateAgencyAndUser();
      await prisma.contentItem.create({
        data: {
          title: slug.toUpperCase(),
          slug,
          type: 'PAGE_DOCUMENT',
          body: JSON.stringify(blocks),
          status: 'PUBLISHED',
          authorId: author.id,
          agencyId: agency.id,
        },
      });
    }

    return NextResponse.json({ message: 'Saved page blocks' });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed' }, { status: 500 });
  }
}
