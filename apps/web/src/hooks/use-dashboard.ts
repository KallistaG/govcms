'use client';

import { useQuery } from '@tanstack/react-query';
import { getAuthHeader } from '../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

async function fetchWithAuth<T>(url: string, emptyFallback: T): Promise<T> {
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });
    if (!res.ok) return emptyFallback;
    return await res.json();
  } catch {
    return emptyFallback;
  }
}

export function useDashboardStats() {
  const emptyFallback = {
    totalPages: 0,
    totalNews: 0,
    totalUsers: 0,
    drafts: 0,
    published: 0,
    storage: { usedGB: 0, totalGB: 50.0, percentage: 0 },
  };

  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => fetchWithAuth(`${API_URL}/dashboard/stats`, emptyFallback),
    refetchInterval: 30000,
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: () => fetchWithAuth(`${API_URL}/dashboard/activity`, []),
    refetchInterval: 15000,
  });
}

export function useLatestNews() {
  return useQuery({
    queryKey: ['dashboard', 'latest-news'],
    queryFn: () => fetchWithAuth(`${API_URL}/dashboard/news`, []),
  });
}

export function useRecentLogins() {
  return useQuery({
    queryKey: ['dashboard', 'recent-logins'],
    queryFn: () => fetchWithAuth(`${API_URL}/dashboard/logins`, []),
  });
}

export function useLatestFiles() {
  return useQuery({
    queryKey: ['dashboard', 'latest-files'],
    queryFn: () => fetchWithAuth(`${API_URL}/dashboard/files`, []),
  });
}
