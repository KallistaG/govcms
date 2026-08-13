import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { AuthConfigurationError, AuthError, requireAuth } from '@/lib/server-auth';
import { requireAgencyScopedAccess, requireMediaAccess } from '@/lib/cms-access';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const actor = requireMediaAccess(await requireAuth(request));
    const agencyId = requireAgencyScopedAccess(actor);

    const assets = await prisma.mediaAsset.findMany({
      where: {
        deletedAt: null,
        ...(agencyId ? { agencyId } : {}),
      },
      select: {
        id: true,
        size: true,
      },
    });

    const usedBytes = assets.reduce((sum, asset) => sum + (asset.size || 0), 0);
    const totalBytes = 50 * 1024 * 1024 * 1024;
    const percentage = totalBytes > 0 ? Math.min(Math.round((usedBytes / totalBytes) * 100), 100) : 0;

    return NextResponse.json({
      fileCount: assets.length,
      usedBytes,
      totalBytes,
      quotaBytes: totalBytes,
      percentage,
    });
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({ message: error?.message || 'Failed to load storage statistics' }, { status: 500 });
  }
}
