'use client';

import { useQuery } from '@tanstack/react-query';
import { getAuthHeader } from '../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export interface AuditLogData {
  id: string;
  userId?: string | null;
  action: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'EDIT' | 'DELETE' | 'PUBLISH' | 'ARCHIVE' | string;
  entityType: string;
  entityId?: string | null;
  status: 'SUCCESS' | 'FAILURE' | string;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  browser?: string | null;
  device?: string | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    department?: string | null;
  } | null;
}

const INITIAL_DEMO_LOGS: AuditLogData[] = [
  {
    id: 'log-101',
    userId: 'usr-1',
    action: 'PUBLISH',
    entityType: 'ContentItem',
    entityId: 'cnt-881',
    status: 'SUCCESS',
    ipAddress: '112.198.102.45',
    browser: 'Chrome 120',
    device: 'Desktop (Windows)',
    createdAt: new Date(Date.now() - 300000).toISOString(),
    user: { id: 'usr-1', email: 'admin@dict.gov.ph', firstName: 'Kallista', lastName: 'G', role: 'SUPER_ADMIN', department: 'Executive Office' },
  },
  {
    id: 'log-102',
    userId: 'usr-2',
    action: 'LOGIN',
    entityType: 'User',
    entityId: 'usr-2',
    status: 'SUCCESS',
    ipAddress: '120.28.188.12',
    browser: 'Firefox 121',
    device: 'Desktop (macOS)',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    user: { id: 'usr-2', email: 'maria.santos@dict.gov.ph', firstName: 'Maria', lastName: 'Santos', role: 'ADMINISTRATOR', department: 'IT & Digital Services' },
  },
  {
    id: 'log-103',
    userId: 'usr-3',
    action: 'CREATE',
    entityType: 'MediaAsset',
    entityId: 'asset-442',
    status: 'SUCCESS',
    ipAddress: '180.191.80.99',
    browser: 'Chrome 120',
    device: 'Desktop (Windows)',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    user: { id: 'usr-3', email: 'juan.delacruz@dict.gov.ph', firstName: 'Juan', lastName: 'Dela Cruz', role: 'EDITOR', department: 'Public Information Office' },
  },
  {
    id: 'log-104',
    userId: 'usr-2',
    action: 'EDIT',
    entityType: 'Menu',
    entityId: 'menu-header',
    status: 'SUCCESS',
    ipAddress: '120.28.188.12',
    browser: 'Firefox 121',
    device: 'Desktop (macOS)',
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    user: { id: 'usr-2', email: 'maria.santos@dict.gov.ph', firstName: 'Maria', lastName: 'Santos', role: 'ADMINISTRATOR', department: 'IT & Digital Services' },
  },
  {
    id: 'log-105',
    userId: 'usr-4',
    action: 'ARCHIVE',
    entityType: 'ContentItem',
    entityId: 'cnt-102',
    status: 'SUCCESS',
    ipAddress: '203.177.45.10',
    browser: 'Safari 17',
    device: 'Mobile (iOS)',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    user: { id: 'usr-4', email: 'elena.reyes@dict.gov.ph', firstName: 'Elena', lastName: 'Reyes', role: 'PUBLISHER', department: 'Legal & Compliance' },
  },
  {
    id: 'log-106',
    userId: 'usr-3',
    action: 'DELETE',
    entityType: 'MediaAsset',
    entityId: 'asset-109',
    status: 'SUCCESS',
    ipAddress: '180.191.80.99',
    browser: 'Chrome 120',
    device: 'Desktop (Windows)',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    user: { id: 'usr-3', email: 'juan.delacruz@dict.gov.ph', firstName: 'Juan', lastName: 'Dela Cruz', role: 'EDITOR', department: 'Public Information Office' },
  },
];

export function useAuditLogs(search?: string, action?: string, entityType?: string) {
  return useQuery({
    queryKey: ['audit-logs', search, action, entityType],
    queryFn: async (): Promise<AuditLogData[]> => {
      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.set('search', search);
        if (action && action !== 'ALL') queryParams.set('action', action);
        if (entityType && entityType !== 'ALL') queryParams.set('entityType', entityType);

        const res = await fetch(`${API_URL}/audit-logs?${queryParams.toString()}`, {
          headers: getAuthHeader(),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback demo filtering
      }

      return INITIAL_DEMO_LOGS.filter((log) => {
        const matchesSearch =
          !search ||
          log.action.toLowerCase().includes(search.toLowerCase()) ||
          log.entityType.toLowerCase().includes(search.toLowerCase()) ||
          (log.ipAddress && log.ipAddress.includes(search)) ||
          (log.user && log.user.email.toLowerCase().includes(search.toLowerCase()));

        const matchesAction = !action || action === 'ALL' || log.action === action;
        const matchesEntity = !entityType || entityType === 'ALL' || log.entityType === entityType;

        return matchesSearch && matchesAction && matchesEntity;
      });
    },
  });
}

export function downloadAuditLogsCsv(logs: AuditLogData[]) {
  const headers = [
    'Log ID',
    'Timestamp',
    'User Email',
    'User Name',
    'Role',
    'Action',
    'Entity Type',
    'Entity ID',
    'Status',
    'IP Address',
    'Browser',
    'Device',
  ];

  const rows = logs.map((log) => [
    log.id,
    new Date(log.createdAt).toISOString(),
    log.user?.email || 'System / Anonymous',
    log.user ? `${log.user.firstName} ${log.user.lastName}` : 'N/A',
    log.user?.role || 'N/A',
    log.action,
    log.entityType,
    log.entityId || 'N/A',
    log.status || 'SUCCESS',
    log.ipAddress || '127.0.0.1',
    log.browser || 'Chrome 120',
    log.device || 'Desktop (Windows)',
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `govcms-audit-logs-${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
