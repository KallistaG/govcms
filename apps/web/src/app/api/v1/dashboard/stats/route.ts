import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { AuthError, AuthConfigurationError, requireAuth } from '@/lib/server-auth';
import { getScopedAgencyId, requireDashboardAccess } from '@/lib/admin-rbac';

export async function GET(request: Request) {
  try {
    const actor = requireDashboardAccess(await requireAuth(request));
    const agencyId = getScopedAgencyId(actor);
    const contentWhere = agencyId ? { agencyId } : undefined;
    const userWhere = agencyId ? { agencyId } : undefined;
    const mediaWhere = agencyId ? { agencyId } : undefined;

    const [totalPages, totalNews, totalUsers, published, drafts, assets] = await Promise.all([
      prisma.contentItem.count({ where: { ...(contentWhere || {}), type: 'PAGE_DOCUMENT' } }).catch(() => 0),
      prisma.contentItem.count({ where: { ...(contentWhere || {}), type: 'PRESS_RELEASE' } }).catch(() => 0),
      prisma.user.count({ where: userWhere }).catch(() => 0),
      prisma.contentItem.count({ where: { ...(contentWhere || {}), status: 'PUBLISHED' } }).catch(() => 0),
      prisma.contentItem.count({ where: { ...(contentWhere || {}), status: 'DRAFT' } }).catch(() => 0),
      prisma.mediaAsset.findMany({ where: mediaWhere }).catch(() => []),
    ]);

    const usedBytes = Array.isArray(assets) ? assets.reduce((sum, a) => sum + (a.size || 0), 0) : 0;
    const usedGB = Number((usedBytes / (1024 * 1024 * 1024)).toFixed(2));

    return NextResponse.json({
      totalPages,
      totalNews,
      totalUsers,
      published,
      drafts,
      storage: {
        usedGB,
        quotaGB: 50,
        percentage: Math.min(Math.round((usedGB / 50) * 100), 100),
      },
    });
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({
      totalPages: 0,
      totalNews: 0,
      totalUsers: 0,
      published: 0,
      drafts: 0,
      storage: { usedGB: 0, quotaGB: 50, percentage: 0 },
    });
  }
}
