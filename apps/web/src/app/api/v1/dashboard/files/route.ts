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
    const files = await prisma.mediaAsset.findMany({
      where: agencyId ? { agencyId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { uploadedBy: { select: { firstName: true, lastName: true } } },
    });

    const formatted = files.map((f) => ({
      id: f.id,
      name: f.filename?.trim() || 'Untitled file',
      size: Number.isFinite(f.size) ? `${(f.size / 1024 / 1024).toFixed(1)} MB` : 'Unknown size',
      type: f.mimeType?.trim() || 'application/octet-stream',
      uploadedBy: getDisplayName(f.uploadedBy),
      uploadedAt: f.createdAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json([]);
  }
}
