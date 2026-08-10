import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { AuthError, AuthConfigurationError, requireAuth } from '@/lib/server-auth';
import { getScopedAgencyId, requireDashboardAccess } from '@/lib/admin-rbac';

export async function GET(request: Request) {
  try {
    const actor = requireDashboardAccess(await requireAuth(request));
    const agencyId = getScopedAgencyId(actor);
    const items = await prisma.contentItem.findMany({
      where: {
        type: 'PRESS_RELEASE',
        ...(agencyId ? { agencyId } : {}),
      },
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
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json([]);
  }
}
