import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { getOrBootstrapAgency } from '@/lib/agency-bootstrap';
import { AuthConfigurationError, AuthError, requireAuth } from '@/lib/server-auth';
import { requireAgencyScopedAccess, requireMediaAccess, requireMediaUploadAccess } from '@/lib/cms-access';
import { writeAuditLog } from '@/lib/audit';
import {
  sanitizeFilename,
  uploadToCloudinary,
  validateMediaFile,
} from '@/lib/media';

export const runtime = 'nodejs';

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function getUserDisplayName(user?: { firstName?: string | null; lastName?: string | null } | null): string {
  const name = [user?.firstName, user?.lastName]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .map((part) => part.trim())
    .join(' ')
    .trim();

  return name || 'System';
}

function resolvePublicAssetUrl(asset: {
  secureUrl?: string | null;
  url?: string | null;
}): string {
  return asset.secureUrl?.trim() || asset.url?.trim() || '';
}

async function resolveTargetAgencyId(
  actor: { role: string; agencyId: string | null },
  requestedAgencyId?: string | null,
): Promise<string> {
  if (actor.role !== 'SUPER_ADMIN') {
    return requireAgencyScopedAccess(actor as any) as string;
  }

  const requested = normalizeString(requestedAgencyId);
  if (requested) {
    const existing = await prisma.agency.findUnique({
      where: { id: requested },
      select: { id: true },
    });

    if (existing) {
      return existing.id;
    }
  }

  const actorAgencyId = normalizeString(actor.agencyId);
  if (actorAgencyId) {
    return actorAgencyId;
  }

  const fallbackAgency = await getOrBootstrapAgency();
  return fallbackAgency.id;
}

async function resolveFolderForAgency(params: {
  folderId?: string | null;
  agencyId: string;
  actorRole: string;
}) {
  const folderId = normalizeString(params.folderId);
  if (!folderId) {
    return null;
  }

  const folder = await prisma.mediaFolder.findFirst({
    where: {
      id: folderId,
      ...(params.actorRole === 'SUPER_ADMIN' ? {} : { agencyId: params.agencyId }),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      agencyId: true,
    },
  });

  if (!folder) {
    throw new Error('Folder not found');
  }

  return folder;
}

function buildMediaWhere(params: {
  agencyId?: string;
  folderId?: string | null;
  search?: string | null;
  mimeType?: string | null;
}) {
  const where: Record<string, unknown> = {
    deletedAt: null,
  };

  if (params.agencyId) {
    where.agencyId = params.agencyId;
  }

  if (params.folderId !== undefined) {
    where.folderId = params.folderId;
  }

  if (params.search) {
    const term = params.search;
    where.OR = [
      { filename: { contains: term, mode: 'insensitive' } },
      { originalFilename: { contains: term, mode: 'insensitive' } },
      { publicId: { contains: term, mode: 'insensitive' } },
      { title: { contains: term, mode: 'insensitive' } },
      { altText: { contains: term, mode: 'insensitive' } },
      { caption: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
    ];
  }

  if (params.mimeType && params.mimeType !== 'all') {
    if (params.mimeType === 'image') {
      where.resourceType = 'image';
    } else if (params.mimeType === 'document') {
      where.resourceType = 'raw';
    } else if (params.mimeType === 'video') {
      where.resourceType = 'video';
    }
  }

  return where;
}

function serializeMediaAsset(asset: {
  id: string;
  filename: string;
  originalName: string;
  originalFilename: string | null;
  publicId: string;
  mimeType: string;
  extension: string | null;
  resourceType: string;
  size: number;
  width: number | null;
  height: number | null;
  url: string;
  secureUrl: string | null;
  thumbnailUrl: string | null;
  dimensions: string | null;
  title: string | null;
  description: string | null;
  altText: string | null;
  caption: string | null;
  folderId: string | null;
  agencyId: string;
  uploadedById: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  uploadedBy?: { firstName?: string | null; lastName?: string | null; avatarUrl?: string | null } | null;
  folder?: { id: string; name: string; slug: string } | null;
}) {
  const publicUrl = resolvePublicAssetUrl(asset);

  return {
    id: asset.id,
    filename: asset.title?.trim() || asset.filename.trim(),
    originalName: asset.originalFilename?.trim() || asset.originalName.trim(),
    originalFilename: asset.originalFilename?.trim() || asset.originalName.trim(),
    publicId: asset.publicId,
    mimeType: asset.mimeType,
    extension: asset.extension,
    resourceType: asset.resourceType,
    size: asset.size,
    width: asset.width,
    height: asset.height,
    url: publicUrl,
    secureUrl: asset.secureUrl?.trim() || publicUrl,
    thumbnailUrl: asset.thumbnailUrl?.trim() || publicUrl,
    dimensions: asset.dimensions || (asset.width && asset.height ? `${asset.width}x${asset.height}` : null),
    title: asset.title,
    description: asset.description,
    altText: asset.altText,
    caption: asset.caption,
    folderId: asset.folderId,
    agencyId: asset.agencyId,
    uploadedById: asset.uploadedById,
    uploadedByName: getUserDisplayName(asset.uploadedBy || null),
    uploadedByAvatar: asset.uploadedBy?.avatarUrl || null,
    folderName: asset.folder?.name || null,
    folderSlug: asset.folder?.slug || null,
    deletedAt: asset.deletedAt ? asset.deletedAt.toISOString() : null,
    createdAt: asset.createdAt.toISOString(),
    updatedAt: asset.updatedAt.toISOString(),
  };
}

async function getMediaList(request: Request) {
  const actor = requireMediaAccess(await requireAuth(request));
  const { searchParams } = new URL(request.url);
  const requestedAgencyId = searchParams.get('agencyId');
  const agencyId = await resolveTargetAgencyId(actor, requestedAgencyId);
  const rawFolderId = searchParams.get('folderId');
  const folderId = rawFolderId === null ? undefined : normalizeString(rawFolderId);
  const search = normalizeString(searchParams.get('search'));
  const mimeType = normalizeString(searchParams.get('mimeType'));

  const assets = await prisma.mediaAsset.findMany({
    where: buildMediaWhere({
      agencyId,
      folderId,
      search,
      mimeType,
    }),
    orderBy: { createdAt: 'desc' },
    include: {
      uploadedBy: { select: { firstName: true, lastName: true, avatarUrl: true } },
      folder: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json(assets.map(serializeMediaAsset));
}

async function uploadMediaFiles(request: Request) {
  const actor = requireMediaUploadAccess(await requireAuth(request));
  const formData = await request.formData();
  const requestedAgencyId = normalizeString(formData.get('agencyId'));
  const agencyId = await resolveTargetAgencyId(actor, requestedAgencyId);
  const folderId = normalizeString(formData.get('folderId'));
  const requestedTitle = normalizeString(formData.get('title'));
  const requestedDescription = normalizeString(formData.get('description'));
  const requestedAltText = normalizeString(formData.get('altText'));
  const requestedCaption = normalizeString(formData.get('caption'));

  const files = [...formData.getAll('files'), ...formData.getAll('file')].filter(
    (value): value is File => typeof File !== 'undefined' && value instanceof File,
  );

  if (!files.length) {
    return NextResponse.json({ message: 'No files were uploaded' }, { status: 400 });
  }

  const folder = await resolveFolderForAgency({
    folderId,
    agencyId,
    actorRole: actor.role,
  });

  const uploadFolder = [agencyId, folder?.slug || 'root'].filter(Boolean).join('/');

  const results: Array<
    | { status: 'success'; asset: ReturnType<typeof serializeMediaAsset> }
    | { status: 'error'; filename: string; message: string }
  > = [];

  for (const file of files) {
    const validation = await validateMediaFile(file);
    if (!validation.ok || !validation.resourceType) {
      results.push({
        status: 'error',
        filename: file.name || 'unknown-file',
        message: validation.message || 'Unsupported file type',
      });
      continue;
    }

    try {
      const safeFilename = sanitizeFilename(file.name);
      const uploadResult = await uploadToCloudinary({
        file,
        resourceType: validation.resourceType,
        folder: uploadFolder,
        publicId: `${safeFilename.replace(/\.[^.]+$/, '')}-${crypto.randomUUID()}`,
        overwrite: false,
      });

      const created = await prisma.mediaAsset.create({
        data: {
          filename: uploadResult.filename,
          originalName: uploadResult.originalFilename,
          originalFilename: uploadResult.originalFilename,
          publicId: uploadResult.publicId,
          mimeType: uploadResult.mimeType,
          extension: uploadResult.format || validation.extension || null,
          resourceType: uploadResult.resourceType,
          size: uploadResult.size,
          width: uploadResult.width,
          height: uploadResult.height,
          url: uploadResult.url,
          secureUrl: uploadResult.secureUrl,
          thumbnailUrl: uploadResult.thumbnailUrl,
          dimensions:
            uploadResult.width && uploadResult.height
              ? `${uploadResult.width}x${uploadResult.height}`
              : null,
          title: requestedTitle || uploadResult.filename,
          description: requestedDescription,
          altText: requestedAltText || file.name,
          caption: requestedCaption,
          folderId: folder?.id || null,
          agencyId,
          uploadedById: actor.id,
        },
        include: {
          uploadedBy: { select: { firstName: true, lastName: true, avatarUrl: true } },
          folder: { select: { id: true, name: true, slug: true } },
        },
      });

      await writeAuditLog({
        actor,
        request,
        action: 'MEDIA_UPLOADED',
        entityType: 'MediaAsset',
        entityId: created.id,
        metadata: {
          agencyId,
          folderId: created.folderId,
          mimeType: created.mimeType,
          size: created.size,
          resourceType: created.resourceType,
        },
      });

      results.push({ status: 'success', asset: serializeMediaAsset(created) });
    } catch (error: any) {
      results.push({
        status: 'error',
        filename: file.name || 'unknown-file',
        message: error?.message || 'Upload failed',
      });
    }
  }

  return NextResponse.json({
    uploaded: results.filter((item) => item.status === 'success'),
    failed: results.filter((item) => item.status === 'error'),
  });
}

export async function GET(request: Request) {
  try {
    return await getMediaList(request);
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({ message: error?.message || 'Failed to load media assets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    return await uploadMediaFiles(request);
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({ message: error?.message || 'Upload failed' }, { status: 500 });
  }
}
