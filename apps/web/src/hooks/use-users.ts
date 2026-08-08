'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthHeader } from '../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export type RoleEnum = 'SUPER_ADMIN' | 'ADMINISTRATOR' | 'EDITOR' | 'PUBLISHER';

export interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: RoleEnum;
  department?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  permissions?: string | string[] | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  agency?: { id: string; name: string; code?: string } | null;
  auditLogs?: Record<string, unknown>[];
}

export function useUsersList(search?: string, role?: string) {
  return useQuery({
    queryKey: ['users', 'list', search, role],
    queryFn: async (): Promise<UserData[]> => {
      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.set('search', search);
        if (role && role !== 'ALL') queryParams.set('role', role);

        const res = await fetch(`${API_URL}/users?${queryParams.toString()}`, {
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

export function useUserDetail(id?: string) {
  return useQuery({
    queryKey: ['users', 'detail', id],
    enabled: !!id,
    queryFn: async (): Promise<UserData> => {
      const res = await fetch(`${API_URL}/users/${id}`, {
        headers: getAuthHeader(),
      });
      if (!res.ok) {
        throw new Error('User not found');
      }
      return await res.json();
    },
  });
}

export function useCreateUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (newUser: Partial<UserData> & { password?: string }) => {
      const res = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(newUser),
      });

      if (!res.ok) {
        throw new Error('Failed to create user');
      }

      return await res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UserData> }) => {
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error('Failed to update user');
      }

      return await res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword?: string }) => {
      const res = await fetch(`${API_URL}/users/${id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ newPassword }),
      });

      if (!res.ok) {
        throw new Error('Failed to reset password');
      }

      return await res.json();
    },
  });
}

export function useToggleUserStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ isActive }),
      });

      if (!res.ok) {
        throw new Error('Failed to toggle user status');
      }

      return await res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
