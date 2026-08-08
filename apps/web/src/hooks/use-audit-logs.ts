'use client';

import { useQuery } from '@tanstack/react-query';
import { getAuthHeader } from '../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

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
        // Fallback
      }

      return [];
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
    log.browser || 'N/A',
    log.device || 'N/A',
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
