'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthHeader } from '../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export interface MediaFolder {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  assetCount?: number;
  createdAt: string;
}

export interface MediaAsset {
  id: string;
  filename: string;
  originalName: string;
  originalFilename?: string;
  publicId: string;
  mimeType: string;
  size: number;
  url: string;
  secureUrl?: string;
  thumbnailUrl?: string;
  resourceType?: string;
  extension?: string | null;
  width?: number | null;
  height?: number | null;
  dimensions?: string;
  altText?: string;
  caption?: string;
  title?: string | null;
  description?: string | null;
  isOptimized?: boolean;
  folderId?: string | null;
  folderName?: string | null;
  folderSlug?: string | null;
  agencyId?: string;
  uploadedById?: string;
  uploadedByName: string;
  uploadedByAvatar?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StorageStats {
  usedBytes: number;
  totalBytes: number;
  percentage: number;
  fileCount: number;
}

export function useMediaFolders() {
  return useQuery({
    queryKey: ['media', 'folders'],
    queryFn: async (): Promise<MediaFolder[]> => {
      try {
        const res = await fetch(`${API_URL}/media/folders`, {
          headers: getAuthHeader(),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) return data;
        }
      } catch {
        // fallback
      }
      return [];
    },
  });
}

export function useCreateMediaFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; parentId?: string }) => {
      const res = await fetch(`${API_URL}/media/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to create folder');
      }

      return await res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media', 'folders'] });
    },
  });
}

export function useMediaAssets(params?: { folderId?: string; search?: string; mimeType?: string }) {
  const queryParams = new URLSearchParams();
  if (params?.folderId) queryParams.set('folderId', params.folderId);
  if (params?.search) queryParams.set('search', params.search);
  if (params?.mimeType && params.mimeType !== 'all') queryParams.set('mimeType', params.mimeType);

  return useQuery({
    queryKey: ['media', 'assets', params],
    queryFn: async (): Promise<MediaAsset[]> => {
      try {
        const res = await fetch(`${API_URL}/media/assets?${queryParams.toString()}`, {
          headers: getAuthHeader(),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) return data;
          if (Array.isArray(data?.data)) return data.data;
        }
      } catch {
        // fallback
      }
      return [];
    },
  });
}

export function useUploadMediaAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(`${API_URL}/media/assets/upload`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Failed to upload file');
      }

      return await res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media'] });
    },
  });
}

export function useUpdateMediaAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MediaAsset> | FormData }) => {
      const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
      const res = await fetch(`${API_URL}/media/assets/${id}`, {
        method: 'PATCH',
        headers: isFormData ? getAuthHeader() : { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: isFormData ? data : JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error('Failed to update asset');
      }

      return await res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media'] });
    },
  });
}

export function useDeleteMediaAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/media/assets/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });

      if (!res.ok) {
        throw new Error('Failed to delete file');
      }

      return await res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media'] });
    },
  });
}

export function useBulkDeleteMediaAssets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch(`${API_URL}/media/assets/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ ids }),
      });

      if (!res.ok) {
        throw new Error('Failed to delete selected files');
      }

      return await res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['media'] });
    },
  });
}

export function useStorageStats() {
  return useQuery({
    queryKey: ['media', 'storage-stats'],
    queryFn: async (): Promise<StorageStats> => {
      try {
        const res = await fetch(`${API_URL}/media/storage-stats`, {
          headers: getAuthHeader(),
        });
        if (res.ok) {
          const data = await res.json();
          const totalBytes = typeof data?.totalBytes === 'number' ? data.totalBytes : typeof data?.quotaBytes === 'number' ? data.quotaBytes : 50 * 1024 * 1024 * 1024;
          const usedBytes = typeof data?.usedBytes === 'number' ? data.usedBytes : 0;
          const percentage = typeof data?.percentage === 'number' ? data.percentage : totalBytes > 0 ? Math.min(Math.round((usedBytes / totalBytes) * 100), 100) : 0;
          const fileCount = typeof data?.fileCount === 'number' ? data.fileCount : 0;

          return {
            usedBytes,
            totalBytes,
            percentage,
            fileCount,
          };
        }
      } catch {
        // fallback
      }

      return {
        usedBytes: 0,
        totalBytes: 50 * 1024 * 1024 * 1024,
        percentage: 0,
        fileCount: 0,
      };
    },
  });
}
