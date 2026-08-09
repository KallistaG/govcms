import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { AuthError, AuthConfigurationError, requireAuth } from '@/lib/server-auth';
import { getScopedAgencyId, requireDashboardAccess } from '@/lib/admin-rbac';

export async function GET(request: Request) {
  try {
    const actor = requireDashboardAccess(await requireAuth(request));
    const agencyId = getScopedAgencyId(actor);
    const files = await prisma.mediaAsset.findMany({
      where: agencyId ? { agencyId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const formatted = files.map((f) => ({
      id: f.id,
      name: f.filename,
      size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
      mimeType: f.mimeType,
      uploadedAt: f.createdAt,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json([]);
  }
}
