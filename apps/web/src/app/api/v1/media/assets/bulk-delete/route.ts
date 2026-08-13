import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';
import { AuthConfigurationError, AuthError, requireAuth } from '@/lib/server-auth';
import { requireAgencyScopedAccess, requireMediaDeleteAccess } from '@/lib/cms-access';
import { collectMediaReferenceCandidates, destroyFromCloudinary, findMediaReferenceMatches } from '@/lib/media';
import { writeAuditLog } from '@/lib/audit';

export const runtime = 'nodejs';

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

export async function POST(request: Request) {
  try {
    const actor = requireMediaDeleteAccess(await requireAuth(request));
    const agencyId = requireAgencyScopedAccess(actor);
    const body = await request.json().catch(() => ({}));
    const ids = Array.isArray(body?.ids)
      ? body.ids.filter((id: unknown): id is string => typeof id === 'string' && id.trim().length > 0)
      : [];

    if (!ids.length) {
      return NextResponse.json({ message: 'No asset ids provided' }, { status: 400 });
    }

    const assets = await prisma.mediaAsset.findMany({
      where: {
        id: { in: ids },
        deletedAt: null,
        ...(agencyId ? { agencyId } : {}),
      },
      select: {
        id: true,
        agencyId: true,
        publicId: true,
        url: true,
        secureUrl: true,
        resourceType: true,
      },
    });

    if (!assets.length) {
      return NextResponse.json({ message: 'No matching media assets found' }, { status: 404 });
    }

    const contentItems = await prisma.contentItem.findMany({
      where: {
        deletedAt: null,
        ...(agencyId ? { agencyId } : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        featuredImage: true,
        body: true,
      },
    });

    const homepageConfigs = await prisma.homepageConfig.findMany({
      where: {
        agencyId: agencyId || undefined,
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
        agencyId: agencyId || undefined,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        blocks: true,
      },
    });

    const referencedAssets = assets.flatMap((asset) => {
      const candidates = collectMediaReferenceCandidates(asset);
      const references: Array<{ assetId: string; entityType: string; entityId: string; label: string; path: string; value: string }> = [];

      for (const item of contentItems) {
        if (item.featuredImage) {
          for (const match of findMediaReferenceMatches({ featuredImage: item.featuredImage }, candidates, ['featuredImage'])) {
            references.push({
              assetId: asset.id,
              entityType: 'ContentItem',
              entityId: item.id,
              label: item.title || item.slug,
              path: match.path,
              value: match.value,
            });
          }
        }

        if (item.body) {
          try {
            const parsed = JSON.parse(item.body);
            for (const match of findMediaReferenceMatches(parsed, candidates, ['body'])) {
              references.push({
                assetId: asset.id,
                entityType: 'ContentItem',
                entityId: item.id,
                label: item.title || item.slug,
                path: match.path,
                value: match.value,
              });
            }
          } catch {
            for (const match of findMediaReferenceMatches(item.body, candidates, ['body'])) {
              references.push({
                assetId: asset.id,
                entityType: 'ContentItem',
                entityId: item.id,
                label: item.title || item.slug,
                path: match.path,
                value: match.value,
              });
            }
          }
        }
      }

      for (const config of homepageConfigs) {
        for (const match of findMediaReferenceMatches(config.sections, candidates, ['sections'])) {
          references.push({
            assetId: asset.id,
            entityType: 'HomepageConfig',
            entityId: config.id,
            label: config.name || config.slug,
            path: match.path,
            value: match.value,
          });
        }
      }

      for (const config of pageBlocks) {
        for (const match of findMediaReferenceMatches(config.blocks, candidates, ['blocks'])) {
          references.push({
            assetId: asset.id,
            entityType: 'PageBlockConfig',
            entityId: config.id,
            label: config.title || config.slug,
            path: match.path,
            value: match.value,
          });
        }
      }

      return references;
    });

    if (referencedAssets.length > 0) {
      const summary = summarizeReferences(referencedAssets);
      await writeAuditLog({
        actor,
        request,
        action: 'MEDIA_BULK_DELETE_BLOCKED',
        entityType: 'MediaAsset',
        entityId: assets.map((asset) => asset.id).join(','),
        status: 'FAILURE',
        metadata: {
          agencyId: agencyId || 'all',
          referenceCount: summary.referenceCount,
          referenceSummary: summary.referenceSummary,
          sampleReferences: referencedAssets.slice(0, 20),
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
    await prisma.mediaAsset.updateMany({
      where: {
        id: { in: assets.map((asset) => asset.id) },
      },
      data: {
        deletedAt,
      },
    });

    const cleanupFailures: Array<{ assetId: string; publicId: string; failureType: string; failedAt: string }> = [];
    for (const asset of assets) {
      await destroyFromCloudinary({
        publicId: asset.publicId,
        resourceType: asset.resourceType as 'image' | 'video' | 'raw' | 'auto',
      }).catch(() => {
        cleanupFailures.push({
          assetId: asset.id,
          publicId: asset.publicId,
          failureType: 'cloudinary_cleanup_failed',
          failedAt: new Date().toISOString(),
        });
      });
    }

    if (cleanupFailures.length > 0) {
      await writeAuditLog({
        actor,
        request,
        action: 'MEDIA_CLOUDINARY_BULK_CLEANUP_FAILED',
        entityType: 'MediaAsset',
        entityId: assets.map((asset) => asset.id).join(','),
        status: 'FAILURE',
        metadata: {
          agencyId: agencyId || 'all',
          failureCount: cleanupFailures.length,
          failures: cleanupFailures.slice(0, 20),
        },
      });
    }

    await writeAuditLog({
      actor,
      request,
      action: 'MEDIA_BULK_DELETED',
      entityType: 'MediaAsset',
      entityId: assets.map((asset) => asset.id).join(','),
      metadata: {
        agencyId: agencyId || 'all',
        deletedCount: assets.length,
      },
    });

    return NextResponse.json({
      message: 'Deleted selected assets',
      deletedCount: assets.length,
      cloudinaryCleanup: cleanupFailures.length > 0 ? 'failed' : 'success',
      deletedAt: deletedAt.toISOString(),
    });
  } catch (error: any) {
    if (error instanceof AuthError || error instanceof AuthConfigurationError) {
      return NextResponse.json({ message: error.message }, { status: error.status ?? 500 });
    }

    return NextResponse.json({ message: error?.message || 'Failed to delete selected assets' }, { status: 500 });
  }
}
