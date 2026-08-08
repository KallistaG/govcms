import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';

export async function GET() {
  try {
    const [totalPages, totalNews, totalUsers, published, drafts, assets] = await Promise.all([
      prisma.contentItem.count({ where: { type: 'PAGE_DOCUMENT' } }).catch(() => 0),
      prisma.contentItem.count({ where: { type: 'PRESS_RELEASE' } }).catch(() => 0),
      prisma.user.count().catch(() => 0),
      prisma.contentItem.count({ where: { status: 'PUBLISHED' } }).catch(() => 0),
      prisma.contentItem.count({ where: { status: 'DRAFT' } }).catch(() => 0),
      prisma.mediaAsset.findMany().catch(() => []),
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
  } catch {
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
