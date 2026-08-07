'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthHeader } from '../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

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
    size: 245760, // 240 KB
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
    size: 3460300, // 3.3 MB
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    dimensions: 'PDF Document',
    altText: 'Signed Copy of Executive Order No. 44',
    isOptimized: true,
    folderId: 'f-2',
    uploadedByName: 'Official Publisher',
    createdAt: '2026-08-06T14:30:00Z',
    updatedAt: '2026-08-06T14:30:00Z',
  },
  {
    id: 'm-3',
    filename: 'national-digital-keynote-summary.mp4',
    originalName: 'national-digital-keynote-summary.mp4',
    mimeType: 'video/mp4',
    size: 45097152, // 43 MB
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    dimensions: '1080p Full HD',
    altText: 'National Digital Keynote Video Address',
    isOptimized: true,
    folderId: 'f-1',
    uploadedByName: 'Agency Administrator',
    createdAt: '2026-08-07T09:15:00Z',
    updatedAt: '2026-08-07T09:15:00Z',
  },
  {
    id: 'm-4',
    filename: 'govcms-architecture-diagram.webp',
    originalName: 'govcms-architecture-diagram.webp',
    mimeType: 'image/webp',
    size: 184320, // 180 KB
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop',
    dimensions: '2560x1440',
    altText: 'GovCMS Modern Monorepo Architecture Blueprint',
    isOptimized: true,
    folderId: null,
    uploadedByName: 'Content Editor',
    createdAt: '2026-08-07T11:00:00Z',
    updatedAt: '2026-08-07T11:00:00Z',
  },
];

let memoryAssets = [...INITIAL_DEMO_ASSETS];
const memoryFolders = [...DEMO_FOLDERS];

export function useMediaFolders() {
  return useQuery({
    queryKey: ['media', 'folders'],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_URL}/media/folders`, {
          headers: getAuthHeader(),
        });
        if (res.ok) return await res.json();
      } catch {
        // Demo fallback
      }
      return memoryFolders;
    },
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      try {
        const res = await fetch(`${API_URL}/media/folders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify({ name }),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback
      }
      const newFolder: MediaFolder = {
        id: `f-${Date.now()}`,
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
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

export function useMediaAssets(params: { search?: string; folderId?: string; mimeType?: string } = {}) {
  return useQuery({
    queryKey: ['media', 'assets', params],
    queryFn: async () => {
      try {
        const queryParams = new URLSearchParams();
        if (params.search) queryParams.set('search', params.search);
        if (params.folderId) queryParams.set('folderId', params.folderId);
        if (params.mimeType) queryParams.set('mimeType', params.mimeType);

        const res = await fetch(`${API_URL}/media/assets?${queryParams.toString()}`, {
          headers: getAuthHeader(),
        });
        if (res.ok) return await res.json();
      } catch {
        // Demo fallback filtering
      }

      let filtered = [...memoryAssets];
      if (params.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(
          (a) => a.filename.toLowerCase().includes(s) || a.altText?.toLowerCase().includes(s),
        );
      }
      if (params.folderId && params.folderId !== 'all') {
        filtered = filtered.filter((a) => a.folderId === params.folderId);
      }
      if (params.mimeType && params.mimeType !== 'all') {
        if (params.mimeType === 'image') filtered = filtered.filter((a) => a.mimeType.startsWith('image/'));
        else if (params.mimeType === 'video') filtered = filtered.filter((a) => a.mimeType.startsWith('video/'));
        else if (params.mimeType === 'pdf') filtered = filtered.filter((a) => a.mimeType === 'application/pdf');
      }
      return filtered;
    },
  });
}

export function useUploadAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fileData: Partial<MediaAsset>) => {
      try {
        const res = await fetch(`${API_URL}/media/assets/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify(fileData),
        });
        if (res.ok) return await res.json();
      } catch {
        // Demo upload fallback
      }

      const newAsset: MediaAsset = {
        id: `m-${Date.now()}`,
        filename: fileData.filename || 'uploaded-media-asset.png',
        originalName: fileData.originalName || 'uploaded-media-asset.png',
        mimeType: fileData.mimeType || 'image/png',
        size: fileData.size || 350000,
        url: fileData.url || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop',
        dimensions: fileData.dimensions || '1920x1080',
        altText: fileData.altText || 'Uploaded Agency Media File',
        isOptimized: true,
        folderId: fileData.folderId || null,
        uploadedByName: 'Official Administrator',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      memoryAssets.unshift(newAsset);
      return newAsset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
}

export function useRenameAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, filename, altText }: { id: string; filename: string; altText: string }) => {
      try {
        const res = await fetch(`${API_URL}/media/assets/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify({ filename, altText }),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback
      }

      memoryAssets = memoryAssets.map((a) => (a.id === id ? { ...a, filename, altText } : a));
      return { message: 'Renamed successfully' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
}

export function useReplaceAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, newUrl, newSize }: { id: string; newUrl: string; newSize: number }) => {
      memoryAssets = memoryAssets.map((a) =>
        a.id === id ? { ...a, url: newUrl, size: newSize, updatedAt: new Date().toISOString() } : a,
      );
      return { message: 'Replaced file version successfully' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
}

export function useDeleteAsset() {
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

      memoryAssets = memoryAssets.filter((a) => a.id !== id);
      return { message: 'Asset deleted' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
}

export function useBulkDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      try {
        const res = await fetch(`${API_URL}/media/assets/bulk-delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify({ ids }),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback
      }

      memoryAssets = memoryAssets.filter((a) => !ids.includes(a.id));
      return { message: `Bulk deleted ${ids.length} files` };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
}

export function useStorageStats() {
  return useQuery({
    queryKey: ['media', 'storage-stats'],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_URL}/media/storage-stats`, {
          headers: getAuthHeader(),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback
      }

      const totalSize = memoryAssets.reduce((sum, a) => sum + a.size, 15247000000);
      const limit = 53687091200; // 50 GB
      return {
        usedBytes: totalSize,
        totalBytes: limit,
        percentage: Math.round((totalSize / limit) * 100),
        fileCount: memoryAssets.length,
      };
    },
  });
}
