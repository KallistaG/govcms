import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { AuthError, AuthConfigurationError, requireAuth } from '@/lib/server-auth';
import { getScopedAgencyId, requireDashboardAccess } from '@/lib/admin-rbac';

function getDisplayName(user?: { firstName?: string | null; lastName?: string | null } | null) {
  const name = [user?.firstName, user?.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ')
    .trim();

  return name || 'Unknown user';
}

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
      title: i.title?.trim() || 'Untitled item',
      category: i.type === 'PRESS_RELEASE' ? 'Press Release' : i.type || 'News',
      authorName: getDisplayName(i.author),
      status: i.status || 'DRAFT',
      publishedAt: i.publishedAt ? i.publishedAt.toISOString() : undefined,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json([]);
  }
}
