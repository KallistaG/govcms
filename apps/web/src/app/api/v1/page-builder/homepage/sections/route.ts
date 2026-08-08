import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';

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
  } catch {
    const sections = await request.json().catch(() => []);
    return NextResponse.json({ id: 'hp-demo', sections, isDraft: true });
  }
}
