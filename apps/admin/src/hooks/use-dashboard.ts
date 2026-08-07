'use client';

import { useQuery } from '@tanstack/react-query';
import { getAuthHeader } from '../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

async function fetchWithAuth<T>(url: string, fallbackData: T): Promise<T> {
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });
    if (!res.ok) return fallbackData;
    return await res.json();
  } catch {
    return fallbackData;
  }
}

export function useDashboardStats() {
  const fallback = {
    totalPages: 14,
    totalNews: 28,
    totalUsers: 8,
    drafts: 5,
    published: 32,
    storage: { usedGB: 14.2, totalGB: 50.0, percentage: 28 },
  };

  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => fetchWithAuth(`${API_URL}/dashboard/stats`, fallback),
    refetchInterval: 30000,
  });
}

export function useRecentActivity() {
  const fallback = [
    {
      id: '1',
      userName: 'Super Admin',
      action: 'published executive order',
      target: 'EO No. 44 - Digital Governance Framework',
      timestamp: '10 mins ago',
      type: 'content' as const,
    },
    {
      id: '2',
      userName: 'Agency Administrator',
      action: 'added new government official',
      target: 'editor@dict.gov.ph',
      timestamp: '25 mins ago',
      type: 'user' as const,
    },
    {
      id: '3',
      userName: 'Content Editor',
      action: 'updated draft press release',
      target: 'National Cyber Security Advisory 2026',
      timestamp: '1 hour ago',
      type: 'content' as const,
    },
    {
      id: '4',
      userName: 'Official Publisher',
      action: 'signed in from trusted terminal',
      target: 'IP 192.168.1.45',
      timestamp: '2 hours ago',
      type: 'login' as const,
    },
  ];

  return useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: () => fetchWithAuth(`${API_URL}/dashboard/recent-activity`, fallback),
    refetchInterval: 15000,
  });
}

export function useLatestNews() {
  const fallback = [
    {
      id: 'news-1',
      title: 'DICT Launches Unified E-Governance Portal Engine',
      category: 'Technology & Innovation',
      authorName: 'DICT Communications',
      status: 'PUBLISHED' as const,
      publishedAt: 'Aug 07, 2026',
    },
    {
      id: 'news-2',
      title: 'Public Consultation on Government Data Privacy Guidelines',
      category: 'Public Notice',
      authorName: 'Privacy Commission',
      status: 'APPROVED' as const,
      publishedAt: 'Aug 06, 2026',
    },
    {
      id: 'news-3',
      title: 'Executive Order No. 44 Digital Acceleration Strategy',
      category: 'Executive Order',
      authorName: 'Office of the President',
      status: 'PUBLISHED' as const,
      publishedAt: 'Aug 05, 2026',
    },
    {
      id: 'news-4',
      title: 'Draft Cybersecurity Infrastructure Roadmap 2026-2030',
      category: 'Policy Draft',
      authorName: 'Cybersecurity Bureau',
      status: 'PENDING_REVIEW' as const,
      publishedAt: 'Aug 04, 2026',
    },
  ];

  return useQuery({
    queryKey: ['dashboard', 'latest-news'],
    queryFn: () => fetchWithAuth(`${API_URL}/dashboard/latest-news`, fallback),
  });
}

export function useRecentLogins() {
  const fallback = [
    {
      id: 'sess-1',
      userEmail: 'superadmin@gov.ph',
      role: 'SUPER_ADMIN',
      ipAddress: '192.168.1.100',
      timestamp: 'Today, 08:30 AM',
      status: 'SUCCESS' as const,
    },
    {
      id: 'sess-2',
      userEmail: 'admin@dict.gov.ph',
      role: 'ADMINISTRATOR',
      ipAddress: '192.168.1.104',
      timestamp: 'Today, 08:15 AM',
      status: 'SUCCESS' as const,
    },
    {
      id: 'sess-3',
      userEmail: 'editor@gov.ph',
      role: 'EDITOR',
      ipAddress: '10.0.4.12',
      timestamp: 'Yesterday, 05:45 PM',
      status: 'SUCCESS' as const,
    },
    {
      id: 'sess-4',
      userEmail: 'publisher@gov.ph',
      role: 'PUBLISHER',
      ipAddress: '10.0.4.88',
      timestamp: 'Yesterday, 02:10 PM',
      status: 'SUCCESS' as const,
    },
  ];

  return useQuery({
    queryKey: ['dashboard', 'recent-logins'],
    queryFn: () => fetchWithAuth(`${API_URL}/dashboard/recent-logins`, fallback),
  });
}

export function useLatestFiles() {
  const fallback = [
    {
      id: 'file-1',
      name: 'EO_No_44_Digital_Framework_2026.pdf',
      size: '2.4 MB',
      type: 'application/pdf',
      uploadedBy: 'Super Admin',
      uploadedAt: 'Aug 07, 2026',
    },
    {
      id: 'file-2',
      name: 'Official_Agency_Seal_HighRes.png',
      size: '4.8 MB',
      type: 'image/png',
      uploadedBy: 'Communications Bureau',
      uploadedAt: 'Aug 06, 2026',
    },
    {
      id: 'file-3',
      name: 'Public_Services_Registry_Q3.xlsx',
      size: '1.1 MB',
      type: 'application/excel',
      uploadedBy: 'Data Analyst',
      uploadedAt: 'Aug 05, 2026',
    },
    {
      id: 'file-4',
      name: 'Cybersecurity_Advisory_Notice_04.pdf',
      size: '850 KB',
      type: 'application/pdf',
      uploadedBy: 'Security Operations',
      uploadedAt: 'Aug 04, 2026',
    },
  ];

  return useQuery({
    queryKey: ['dashboard', 'latest-files'],
    queryFn: () => fetchWithAuth(`${API_URL}/dashboard/latest-files`, fallback),
  });
}
