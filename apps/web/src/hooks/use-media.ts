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
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  dimensions?: string;
  altText?: string;
  caption?: string;
  isOptimized?: boolean;
  folderId?: string | null;
  uploadedByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface StorageStats {
  usedBytes: number;
  totalBytes: number;
  percentage: number;
  fileCount: number;
}

const DEMO_FOLDERS: MediaFolder[] = [
  { id: 'f-1', name: 'Press Releases 2026', slug: 'press-releases-2026', assetCount: 12, createdAt: '2026-08-01' },
  { id: 'f-2', name: 'Executive Orders', slug: 'executive-orders', assetCount: 8, createdAt: '2026-08-02' },
  { id: 'f-3', name: 'Agency Logos & Branding', slug: 'logos-branding', assetCount: 14, createdAt: '2026-08-03' },
  { id: 'f-4', name: 'Public Notices', slug: 'public-notices', assetCount: 6, createdAt: '2026-08-04' },
];

const INITIAL_DEMO_ASSETS: MediaAsset[] = [
  {
    id: 'm-1',
    filename: 'dict-logo-official-hd.png',
    originalName: 'dict-logo-official-hd.png',
    mimeType: 'image/png',
    size: 245760,
    url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop',
    dimensions: '1920x1080',
    altText: 'Official DICT Agency Logo High Resolution',
    isOptimized: true,
    folderId: 'f-3',
    uploadedByName: 'Super Admin',
    createdAt: '2026-08-05T10:00:00Z',
    updatedAt: '2026-08-05T10:00:00Z',
  },
  {
    id: 'm-2',
    filename: 'executive-order-44-signed.pdf',
    originalName: 'executive-order-44-signed.pdf',
    mimeType: 'application/pdf',
    size: 3460300,
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    dimensions: 'PDF Document',
    altText: 'Signed Copy of Executive Order No. 44',
    isOptimized: true,
    folderId: 'f-2',
    uploadedByName: 'Official Publisher',
    createdAt: '2026-08-06T14:30:00Z',
    updatedAt: '2026-08-06T14:30:00Z',
  },
];

let memoryDemoAssets = [...INITIAL_DEMO_ASSETS];
const memoryFolders = [...DEMO_FOLDERS];

export function useMediaFolders() {
  return useQuery({
    queryKey: ['media', 'folders'],
    queryFn: async (): Promise<MediaFolder[]> => {
      try {
        const res = await fetch(`${API_URL}/media/folders`, {
          headers: getAuthHeader(),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback demo
      }
      return memoryFolders;
    },
  });
}

export function useCreateMediaFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, parentId }: { name: string; parentId?: string }) => {
      try {
        const res = await fetch(`${API_URL}/media/folders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
          body: JSON.stringify({ name, parentId }),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback
      }

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const newFolder: MediaFolder = {
        id: `f-${Date.now()}`,
        name,
        slug,
        parentId: parentId || null,
        assetCount: 0,
        createdAt: new Date().toISOString(),
      };
      memoryFolders.push(newFolder);
      return newFolder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', 'folders'] });
    },
  });
}

export function useMediaAssets(folderId?: string | null, search?: string, mimeGroup?: string) {
  return useQuery({
    queryKey: ['media', 'assets', folderId, search, mimeGroup],
    queryFn: async (): Promise<MediaAsset[]> => {
      try {
        const queryParams = new URLSearchParams();
        if (folderId) queryParams.set('folderId', folderId);
        if (search) queryParams.set('search', search);
        if (mimeGroup) queryParams.set('mimeGroup', mimeGroup);

        const res = await fetch(`${API_URL}/media/assets?${queryParams.toString()}`, {
          headers: getAuthHeader(),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback demo filtering
      }

      return memoryDemoAssets.filter((asset) => {
        const matchesFolder = !folderId || asset.folderId === folderId;
        const matchesSearch =
          !search ||
          asset.filename.toLowerCase().includes(search.toLowerCase()) ||
          (asset.altText && asset.altText.toLowerCase().includes(search.toLowerCase()));

        let matchesType = true;
        if (mimeGroup === 'image') matchesType = asset.mimeType.startsWith('image/');
        if (mimeGroup === 'document') matchesType = asset.mimeType.includes('pdf') || asset.mimeType.includes('doc') || asset.mimeType.includes('excel');
        if (mimeGroup === 'video') matchesType = asset.mimeType.startsWith('video/');

        return matchesFolder && matchesSearch && matchesType;
      });
    },
  });
}

export function useUploadMediaAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, folderId, altText }: { file: File; folderId?: string; altText?: string }) => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        if (folderId) formData.append('folderId', folderId);
        if (altText) formData.append('altText', altText);

        const res = await fetch(`${API_URL}/media/assets/upload`, {
          method: 'POST',
          headers: getAuthHeader(),
          body: formData,
        });
        if (res.ok) return await res.json();
      } catch {
        // Demo upload fallback
      }

      const mockAsset: MediaAsset = {
        id: `m-${Date.now()}`,
        filename: file.name,
        originalName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        url: URL.createObjectURL(file),
        dimensions: file.type.startsWith('image/') ? '1920x1080' : 'File Asset',
        altText: altText || file.name,
        isOptimized: true,
        folderId: folderId || null,
        uploadedByName: 'Official Administrator',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      memoryDemoAssets.unshift(mockAsset);
      return mockAsset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
}

export function useUpdateMediaAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MediaAsset> }) => {
      try {
        const res = await fetch(`${API_URL}/media/assets/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
          body: JSON.stringify(data),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback
      }

      memoryDemoAssets = memoryDemoAssets.map((asset) =>
        asset.id === id ? { ...asset, ...data, updatedAt: new Date().toISOString() } : asset,
      );
      return { message: 'Asset metadata updated' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
}

export function useDeleteMediaAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const res = await fetch(`${API_URL}/media/assets/${id}`, {
          method: 'DELETE',
          headers: getAuthHeader(),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback
      }

      memoryDemoAssets = memoryDemoAssets.filter((a) => a.id !== id);
      return { message: 'Asset deleted' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
}

export function useBulkDeleteMediaAssets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      try {
        const res = await fetch(`${API_URL}/media/assets/bulk-delete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
          body: JSON.stringify({ ids }),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback
      }

      memoryDemoAssets = memoryDemoAssets.filter((a) => !ids.includes(a.id));
      return { message: `${ids.length} files deleted` };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
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
        if (res.ok) return await res.json();
      } catch {
        // Fallback
      }

      const totalUsed = memoryDemoAssets.reduce((acc, a) => acc + a.size, 0);
      const limit = 50 * 1024 * 1024 * 1024; // 50 GB
      return {
        usedBytes: totalUsed,
        totalBytes: limit,
        percentage: Math.min(Math.round((totalUsed / limit) * 100), 100),
        fileCount: memoryDemoAssets.length,
      };
    },
  });
}
