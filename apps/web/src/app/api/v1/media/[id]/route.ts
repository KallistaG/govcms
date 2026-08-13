import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { getOrBootstrapAgency } from '@/lib/agency-bootstrap';
import { AuthConfigurationError, AuthError, AuthenticatedUser, requireAuth } from '@/lib/server-auth';
import {
  requireAgencyScopedAccess,
  requireMediaAccess,
  requireMediaDeleteAccess,
  requireMediaUploadAccess,
} from '@/lib/cms-access';
import { writeAuditLog } from '@/lib/audit';
import {
  collectMediaReferenceCandidates,
  destroyFromCloudinary,
  findMediaReferenceMatches,
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

async function findMediaReferences(actor: AuthenticatedUser, asset: { url: string; secureUrl: string | null; publicId: string; agencyId: string }) {
  const candidates = collectMediaReferenceCandidates(asset);
  const contentItems = await prisma.contentItem.findMany({
    where: {
      deletedAt: null,
      ...(actor.role === 'SUPER_ADMIN' ? {} : { agencyId: asset.agencyId }),
    },
    select: {
      id: true,
      title: true,
      slug: true,
      agencyId: true,
      featuredImage: true,
      body: true,
    },
  });

  const homepageConfigs = await prisma.homepageConfig.findMany({
    where: {
      agencyId: asset.agencyId,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      sections: true,
    },
  });

  const pageBlocks = await prisma.pageBlockConfig.findMany({
    where: {
      agencyId: asset.agencyId,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      blocks: true,
    },
  });

  const references: Array<{ entityType: string; entityId: string; label: string; path: string; value: string }> = [];

  for (const item of contentItems) {
    const itemReferences: Array<{ path: string; value: string }> = [];

    if (item.featuredImage) {
      itemReferences.push(
        ...findMediaReferenceMatches({ featuredImage: item.featuredImage }, candidates, ['featuredImage']),
      );
    }

    if (item.body) {
      try {
        const parsed = JSON.parse(item.body);
        itemReferences.push(...findMediaReferenceMatches(parsed, candidates, ['body']));
      } catch {
        itemReferences.push(...findMediaReferenceMatches(item.body, candidates, ['body']));
      }
    }

    for (const reference of itemReferences) {
      references.push({
        entityType: 'ContentItem',
        entityId: item.id,
        label: item.title || item.slug,
        ...reference,
      });
    }
  }

  for (const config of homepageConfigs) {
    const configReferences = findMediaReferenceMatches(config.sections, candidates, ['sections']);
    for (const reference of configReferences) {
      references.push({
        entityType: 'HomepageConfig',
        entityId: config.id,
        label: config.name || config.slug,
        ...reference,
      });
    }
  }

  for (const config of pageBlocks) {
    const blockReferences = findMediaReferenceMatches(config.blocks, candidates, ['blocks']);
    for (const reference of blockReferences) {
      references.push({
        entityType: 'PageBlockConfig',
        entityId: config.id,
        label: config.title || config.slug,
        ...reference,
      });
    }
  }

  return references;
}

function summarizeReferences(
  references: Array<{ entityType: string; entityId: string; label: string; path: string; value: string }>,
) {
  const uniqueTargets = new Map<string, { entityType: string; entityId: string; label: string }>();
  const summary = new Map<string, Set<string>>();

  for (const reference of references) {
    const targetKey = `${reference.entityType}:${reference.entityId}`;
    uniqueTargets.set(targetKey, {
      entityType: reference.entityType,
      entityId: reference.entityId,
      label: reference.label,
    });
    const bucket = summary.get(reference.entityType) || new Set<string>();
    bucket.add(targetKey);
    summary.set(reference.entityType, bucket);
  }

  return {
    referenceCount: uniqueTargets.size,
    referenceSummary: Object.fromEntries(Array.from(summary.entries(), ([key, value]) => [key, value.size])),
  };
}

function buildReferenceMessage(referenceSummary: Record<string, number>): string {
  const parts: string[] = [];
  const contentCount = referenceSummary.ContentItem || 0;
  const homepageCount = referenceSummary.HomepageConfig || 0;
  const pageBlockCount = referenceSummary.PageBlockConfig || 0;

  if (contentCount > 0) {
    parts.push(`${contentCount} content item${contentCount === 1 ? '' : 's'}`);
  }
  if (homepageCount > 0) {
    parts.push(`${homepageCount} homepage configuration${homepageCount === 1 ? '' : 's'}`);
  }
  if (pageBlockCount > 0) {
    parts.push(`${pageBlockCount} page block configuration${pageBlockCount === 1 ? '' : 's'}`);
  }

  if (!parts.length) {
    return 'This media file is currently in use and cannot be deleted yet.';
  }
  return `This media file is currently used by ${parts.join(', ')} and cannot be deleted yet.`;
}

function getUserDisplayName(user?: { firstName?: string | null; lastName?: string | null } | null): string {
  const name = [user?.firstName, user?.lastName]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .map((part) => part.trim())
    .join(' ')
    .trim();

  return name || 'System';
}

async function resolveTargetAgencyId(
  actor: AuthenticatedUser,
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

async function resolveFolderId(params: {
  actor: AuthenticatedUser;
  agencyId: string;
  folderId?: string | null;
}) {
  const folderId = normalizeString(params.folderId);
  if (!folderId) {
    return null;
  }

  const folder = await prisma.mediaFolder.findFirst({
    where: {
      id: folderId,
      ...(params.actor.role === 'SUPER_ADMIN' ? {} : { agencyId: params.agencyId }),
    },
    select: { id: true },
  });

  if (!folder) {
    throw new Error('Folder not found');
  }

  return folder.id;
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
  const publicUrl = asset.secureUrl?.trim() || asset.url.trim();

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

async function findMediaAsset(actor: AuthenticatedUser, id: string) {
  const agencyId = await resolveTargetAgencyId(actor, null);

  return prisma.mediaAsset.findFirst({
    where: {
      id,
      deletedAt: null,
      ...(actor.role === 'SUPER_ADMIN' ? {} : { agencyId }),
    },
    include: {
      uploadedBy: { select: { firstName: true, lastName: true, avatarUrl: true } },
      folder: { select: { id: true, name: true, slug: true } },
    },
  });
}

async function updateMetadata(
  request: Request,
  actor: AuthenticatedUser,
  id: string,
) {
  const existing = await findMediaAsset(actor, id);
  if (!existing) {
    return NextResponse.json({ message: 'Media asset not found' }, { status: 404 });
  }

  const contentType = request.headers.get('content-type') || '';
  const isFormData = contentType.includes('multipart/form-data');
  const body = isFormData ? null : ((await request.json()) as Record<string, unknown>);
  const formData = isFormData ? await request.formData() : null;

  const title = normalizeString(
    formData ? formData.get('title') : body?.title,
  );
  const filename = normalizeString(
    formData ? formData.get('filename') : body?.filename,
  );
  const altText = normalizeString(
    formData ? formData.get('altText') : body?.altText,
  );
  const caption = normalizeString(
    formData ? formData.get('caption') : body?.caption,
  );
  const description = normalizeString(
    formData ? formData.get('description') : body?.description,
  );
  const folderId = normalizeString(
    formData ? formData.get('folderId') : body?.folderId,
  );

  const nextFolderId = folderId === null ? existing.folderId : await resolveFolderId({
    actor,
    agencyId: existing.agencyId,
    folderId,
  });

  const replacementFile = formData
    ? formData.get('file')
    : null;

  if (replacementFile instanceof File) {
    requireMediaUploadAccess(actor);

    const validation = await validateMediaFile(replacementFile);
    if (!validation.ok || !validation.resourceType) {
      return NextResponse.json(
        { message: validation.message || 'Unsupported file type' },
        { status: 400 },
      );
    }

    const uploadResult = await uploadToCloudinary({
      file: replacementFile,
      resourceType: validation.resourceType,
      publicId: existing.publicId,
      overwrite: true,
    });

    const updated = await prisma.mediaAsset.update({
      where: { id: existing.id },
      data: {
        filename: title || filename || uploadResult.filename,
        originalName: uploadResult.originalFilename,
        originalFilename: uploadResult.originalFilename,
        publicId: uploadResult.publicId,
        mimeType: uploadResult.mimeType,
        extension: uploadResult.format || validation.extension || existing.extension,
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
            : existing.dimensions,
        title: title || filename || existing.title || uploadResult.filename,
        description: description ?? existing.description,
        altText: altText ?? existing.altText,
        caption: caption ?? existing.caption,
        folderId: nextFolderId,
      },
      include: {
        uploadedBy: { select: { firstName: true, lastName: true, avatarUrl: true } },
        folder: { select: { id: true, name: true, slug: true } },
      },
    });

    await writeAuditLog({
      actor,
      request,
      action: 'MEDIA_REPLACED',
      entityType: 'MediaAsset',
      entityId: updated.id,
      metadata: {
        agencyId: updated.agencyId,
        folderId: updated.folderId,
        mimeType: updated.mimeType,
        size: updated.size,
        resourceType: updated.resourceType,
      },
    });

    return NextResponse.json(serializeMediaAsset(updated));
  }

  const updated = await prisma.mediaAsset.update({
    where: { id: existing.id },
    data: {
      filename: sanitizeFilename(filename || existing.filename),
      title: title || filename || existing.title || existing.filename,
      altText: altText ?? existing.altText,
      caption: caption ?? existing.caption,
      description: description ?? existing.description,
      folderId: nextFolderId,
    },
    include: {
      uploadedBy: { select: { firstName: true, lastName: true, avatarUrl: true } },
      folder: { select: { id: true, name: true, slug: true } },
    },
  });

  await writeAuditLog({
    actor,
    request,
    action: 'MEDIA_UPDATED',
    entityType: 'MediaAsset',
    entityId: updated.id,
    metadata: {
      agencyId: updated.agencyId,
      folderId: updated.folderId,
    },
  });

  return NextResponse.json(serializeMediaAsset(updated));
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = requireMediaAccess(await requireAuth(request));
    const { id } = await params;
    const asset = await findMediaAsset(actor, id);

    if (!asset) {
      return NextResponse.json({ message: 'Media asset not found' }, { status: 404 });
    }

    return NextResponse.json(serializeMediaAsset(asset));
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({ message: error?.message || 'Media asset not found' }, { status: 404 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = requireMediaAccess(await requireAuth(request));
    const { id } = await params;
    return await updateMetadata(request, actor, id);
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({ message: error?.message || 'Failed to update media asset' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return PUT(request, context);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = requireMediaDeleteAccess(await requireAuth(request));
    const { id } = await params;
    const asset = await findMediaAsset(actor, id);

    if (!asset) {
      return NextResponse.json({ message: 'Media asset not found' }, { status: 404 });
    }

    const references = await findMediaReferences(actor, asset);
    if (references.length > 0) {
      const summary = summarizeReferences(references);
      await writeAuditLog({
        actor,
        request,
        action: 'MEDIA_DELETE_BLOCKED',
        entityType: 'MediaAsset',
        entityId: asset.id,
        status: 'FAILURE',
        metadata: {
          agencyId: asset.agencyId,
          referenceCount: summary.referenceCount,
          referenceSummary: summary.referenceSummary,
          sampleReferences: references.slice(0, 10),
        },
      });

      return NextResponse.json(
        {
          message: buildReferenceMessage(summary.referenceSummary),
          referenceCount: summary.referenceCount,
          referenceSummary: summary.referenceSummary,
        },
        { status: 409 },
      );
    }

    const deletedAt = new Date();
    const updated = await prisma.mediaAsset.update({
      where: { id: asset.id },
      data: {
        deletedAt,
      },
    });

    await writeAuditLog({
      actor,
      request,
      action: 'MEDIA_DELETED',
      entityType: 'MediaAsset',
      entityId: updated.id,
      metadata: {
        agencyId: updated.agencyId,
        folderId: updated.folderId,
        resourceType: updated.resourceType,
      },
    });

    let cleanupSucceeded = true;
    try {
      await destroyFromCloudinary({
        publicId: updated.publicId,
        resourceType: updated.resourceType as 'image' | 'video' | 'raw' | 'auto',
      });
    } catch {
      cleanupSucceeded = false;
      await writeAuditLog({
        actor,
        request,
        action: 'MEDIA_CLOUDINARY_CLEANUP_FAILED',
        entityType: 'MediaAsset',
        entityId: updated.id,
        status: 'FAILURE',
        metadata: {
          assetId: updated.id,
          agencyId: updated.agencyId,
          resourceType: updated.resourceType,
          publicId: updated.publicId,
          failureType: 'cloudinary_cleanup_failed',
          failedAt: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      message: 'Media asset deleted successfully',
      cloudinaryCleanup: cleanupSucceeded ? 'success' : 'failed',
      deletedAt: deletedAt.toISOString(),
    });
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({ message: error?.message || 'Failed to delete media asset' }, { status: 500 });
  }
}
