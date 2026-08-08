import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';

export async function GET() {
  try {
    const items = await prisma.contentItem.findMany({
      where: { type: 'PRESS_RELEASE' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { author: { select: { firstName: true, lastName: true } } },
    });
    const formatted = items.map((i) => ({
      id: i.id,
      title: i.title,
      slug: i.slug,
      status: i.status,
      author: i.author ? `${i.author.firstName} ${i.author.lastName}` : 'Official Desk',
      date: i.createdAt,
    }));
    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json([
      {
        id: 'n1',
        title: 'DICT Launches Enterprise Cloud Infrastructure for Regional Government Units',
        slug: 'dict-launches-enterprise-cloud-infrastructure',
        status: 'PUBLISHED',
        author: 'Maria Santos',
        date: new Date().toISOString(),
      },
    ]);
  }
}
