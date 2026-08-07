'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthHeader } from '../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export interface ContentItem {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  body: string;
  type: 'PAGE_DOCUMENT' | 'PRESS_RELEASE' | 'PUBLIC_NOTICE' | 'EVENT';
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
  featuredImage?: string;
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

const INITIAL_DEMO_ITEMS: ContentItem[] = [
  {
    id: 'c-1',
    title: 'Executive Order No. 44 - National Digital Transformation Strategy',
    slug: 'executive-order-44-digital-strategy',
    summary: 'Directing all government departments to adopt unified e-governance standards.',
    body: 'Full executive order text detailing digital governance protocols and agency mandates.',
    type: 'EVENT',
    status: 'PUBLISHED',
    authorName: 'Super Admin',
    agencyName: 'Department of Information & Communications Technology',
    publishedAt: '2026-08-05',
    createdAt: '2026-08-05T08:00:00Z',
    updatedAt: '2026-08-05T08:00:00Z',
  },
  {
    id: 'c-2',
    title: 'DICT Announces Public Consultation on Cybersecurity Framework',
    slug: 'public-consultation-cybersecurity-framework',
    summary: 'Inviting public stakeholder feedback on cloud security requirements.',
    body: 'Public notice body content providing feedback links and submission dates.',
    type: 'PUBLIC_NOTICE',
    status: 'PUBLISHED',
    authorName: 'Official Publisher',
    agencyName: 'Department of Information & Communications Technology',
    publishedAt: '2026-08-06',
    createdAt: '2026-08-06T09:30:00Z',
    updatedAt: '2026-08-06T09:30:00Z',
  },
  {
    id: 'c-3',
    title: 'GovCMS Portal Engine Version 1.0 Enterprise Launch',
    slug: 'govcms-portal-engine-launch',
    summary: 'Introducing Next.js 15 and React 19 architecture for public service portals.',
    body: 'Press release introducing features, accessibility compliance, and performance metrics.',
    type: 'PRESS_RELEASE',
    status: 'PUBLISHED',
    authorName: 'Agency Administrator',
    agencyName: 'Department of Information & Communications Technology',
    publishedAt: '2026-08-07',
    createdAt: '2026-08-07T10:00:00Z',
    updatedAt: '2026-08-07T10:00:00Z',
  },
  {
    id: 'c-4',
    title: 'About the Department of Information & Communications Technology',
    slug: 'about-dict-agency-overview',
    summary: 'Official agency mandate, organizational structure, and leadership.',
    body: 'Static page content detailing DICT offices, regional bureaus, and contact directory.',
    type: 'PAGE_DOCUMENT',
    status: 'PUBLISHED',
    authorName: 'Content Editor',
    agencyName: 'Department of Information & Communications Technology',
    publishedAt: '2026-08-01',
    createdAt: '2026-08-01T12:00:00Z',
    updatedAt: '2026-08-01T12:00:00Z',
  },
  {
    id: 'c-5',
    title: 'Draft Policy on Open Government Data Sharing Standards',
    slug: 'draft-policy-open-data-sharing',
    summary: 'Technical guidelines for open dataset APIs across government agencies.',
    body: 'Draft specification for open data endpoints, JSON schemas, and rate limits.',
    type: 'PAGE_DOCUMENT',
    status: 'DRAFT',
    authorName: 'Content Editor',
    agencyName: 'Department of Information & Communications Technology',
    createdAt: '2026-08-07T11:00:00Z',
    updatedAt: '2026-08-07T11:00:00Z',
  },
];

let memoryDemoItems = [...INITIAL_DEMO_ITEMS];

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

        const res = await fetch(`${API_URL}/content?${queryParams.toString()}`, {
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        });

        if (res.ok) {
          return await res.json();
        }
        throw new Error('API query failed');
      } catch {
        // Local memory fallback filtering for demo preview mode
        let filtered = [...memoryDemoItems];

        if (params.search) {
          const s = params.search.toLowerCase();
          filtered = filtered.filter(
            (i) => i.title.toLowerCase().includes(s) || i.summary?.toLowerCase().includes(s),
          );
        }

        if (params.type) {
          filtered = filtered.filter((i) => i.type === params.type);
        }

        if (params.status) {
          filtered = filtered.filter((i) => i.status === params.status);
        }

        const page = params.page || 1;
        const limit = params.limit || 10;
        const totalItems = filtered.length;
        const start = (page - 1) * limit;
        const data = filtered.slice(start, start + limit);

        return {
          data,
          meta: {
            totalItems,
            itemCount: data.length,
            itemsPerPage: limit,
            totalPages: Math.ceil(totalItems / limit) || 1,
            currentPage: page,
          },
        };
      }
    },
  });
}

export function useCreateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newItem: Partial<ContentItem>) => {
      try {
        const res = await fetch(`${API_URL}/content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
          body: JSON.stringify(newItem),
        });

        if (res.ok) return await res.json();
      } catch {
        // Fallback demo creation
      }

      const createdItem: ContentItem = {
        id: `c-${Date.now()}`,
        title: newItem.title || 'Untitled Document',
        slug: newItem.slug || 'untitled-document',
        summary: newItem.summary,
        body: newItem.body || '',
        type: newItem.type || 'PAGE_DOCUMENT',
        status: newItem.status || 'DRAFT',
        featuredImage: newItem.featuredImage,
        eventDate: newItem.eventDate,
        location: newItem.location,
        authorName: 'Official Administrator',
        agencyName: 'Department of Information & Communications Technology',
        publishedAt: newItem.status === 'PUBLISHED' ? new Date().toISOString().split('T')[0] : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      memoryDemoItems.unshift(createdItem);
      return createdItem;
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
      try {
        const res = await fetch(`${API_URL}/content/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
          body: JSON.stringify(data),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback demo update
      }

      memoryDemoItems = memoryDemoItems.map((item) =>
        item.id === id ? { ...item, ...data, updatedAt: new Date().toISOString() } : item,
      );
      return { message: 'Updated successfully' };
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
      try {
        const res = await fetch(`${API_URL}/content/${id}`, {
          method: 'DELETE',
          headers: getAuthHeader(),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback demo delete
      }

      memoryDemoItems = memoryDemoItems.filter((i) => i.id !== id);
      return { message: 'Soft deleted successfully' };
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
      const endpoint = `${API_URL}/content/bulk-${action}`;
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
          body: JSON.stringify({ ids }),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback demo bulk handler
      }

      if (action === 'delete') {
        memoryDemoItems = memoryDemoItems.filter((i) => !ids.includes(i.id));
      } else if (action === 'publish') {
        memoryDemoItems = memoryDemoItems.map((i) =>
          ids.includes(i.id)
            ? { ...i, status: 'PUBLISHED', publishedAt: new Date().toISOString().split('T')[0] }
            : i,
        );
      } else if (action === 'archive') {
        memoryDemoItems = memoryDemoItems.map((i) =>
          ids.includes(i.id) ? { ...i, status: 'ARCHIVED' } : i,
        );
      }

      return { message: `Bulk ${action} applied to ${ids.length} item(s)` };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content'] });
    },
  });
}
