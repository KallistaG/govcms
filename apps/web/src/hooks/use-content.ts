'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthHeader } from '../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export interface ContentItem {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  body: string;
  type: 'PAGE_DOCUMENT' | 'PRESS_RELEASE' | 'PUBLIC_NOTICE' | 'EVENT';
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
  featuredImage?: string | null;
  eventDate?: string;
  location?: string;
  authorName: string;
  agencyName: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentQueryParams {
  search?: string;
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export function useContentList(params: ContentQueryParams = {}) {
  return useQuery({
    queryKey: ['content', 'list', params],
    queryFn: async () => {
      try {
        const queryParams = new URLSearchParams();
        if (params.search) queryParams.set('search', params.search);
        if (params.type) queryParams.set('type', params.type);
        if (params.status) queryParams.set('status', params.status);
        if (params.page) queryParams.set('page', String(params.page));
        if (params.limit) queryParams.set('limit', String(params.limit));

        const res = await fetch(`${API_URL}/contents?${queryParams.toString()}`, {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        });

        if (res.ok) {
          return await res.json();
        }
      } catch {
        // Fallback
      }

      return {
        data: [],
        meta: {
          totalItems: 0,
          itemCount: 0,
          itemsPerPage: params.limit || 10,
          totalPages: 0,
          currentPage: params.page || 1,
        },
      };
    },
  });
}

export function useCreateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newItem: Partial<ContentItem>) => {
      const res = await fetch(`${API_URL}/contents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(newItem),
      });

      if (!res.ok) {
        throw new Error('Failed to create content');
      }

      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });
}

export function useUpdateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ContentItem> }) => {
      const res = await fetch(`${API_URL}/contents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error('Failed to update content');
      }

      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });
}

export function useDeleteContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/contents/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });

      if (!res.ok) {
        throw new Error('Failed to delete content');
      }

      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });
}

export function useBulkAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      action,
      ids,
    }: {
      action: 'delete' | 'publish' | 'archive';
      ids: string[];
    }) => {
      const endpoint = `${API_URL}/contents/bulk`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ action, ids }),
      });

      if (!res.ok) {
        throw new Error(`Failed to perform bulk ${action}`);
      }

      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });
}
