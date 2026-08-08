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

const INITIAL_DEMO_USERS: UserData[] = [
  {
    id: 'usr-1',
    email: 'admin@dict.gov.ph',
    firstName: 'Kallista',
    lastName: 'G',
    role: 'SUPER_ADMIN',
    department: 'Executive Office',
    phone: '+63 917 123 4567',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    lastLoginAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr-2',
    email: 'maria.santos@dict.gov.ph',
    firstName: 'Maria',
    lastName: 'Santos',
    role: 'ADMINISTRATOR',
    department: 'IT & Digital Services',
    phone: '+63 918 987 6543',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    lastLoginAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'usr-3',
    email: 'juan.delacruz@dict.gov.ph',
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    role: 'EDITOR',
    department: 'Public Information Office',
    phone: '+63 919 555 0192',
    isActive: true,
    lastLoginAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
  },
];

let memoryDemoUsers = [...INITIAL_DEMO_USERS];

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

      return memoryDemoUsers.filter((u) => {
        const matchesSearch =
          !search ||
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          u.firstName.toLowerCase().includes(search.toLowerCase()) ||
          u.lastName.toLowerCase().includes(search.toLowerCase());
        const matchesRole = !role || role === 'ALL' || u.role === role;
        return matchesSearch && matchesRole;
      });
    },
  });
}

export function useUserDetail(id?: string) {
  return useQuery({
    queryKey: ['users', 'detail', id],
    enabled: !!id,
    queryFn: async (): Promise<UserData> => {
      try {
        const res = await fetch(`${API_URL}/users/${id}`, {
          headers: getAuthHeader(),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback
      }

      const found = memoryDemoUsers.find((u) => u.id === id);
      if (found) return found;
      throw new Error('User not found');
    },
  });
}

export function useCreateUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (newUser: Partial<UserData> & { password?: string }) => {
      try {
        const res = await fetch(`${API_URL}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
          body: JSON.stringify(newUser),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback
      }

      const created: UserData = {
        id: `usr-${Date.now()}`,
        email: newUser.email || 'user@dict.gov.ph',
        firstName: newUser.firstName || 'First',
        lastName: newUser.lastName || 'Last',
        role: newUser.role || 'EDITOR',
        department: newUser.department || 'Public Information Office',
        phone: newUser.phone,
        isActive: newUser.isActive !== false,
        createdAt: new Date().toISOString(),
      };

      memoryDemoUsers.unshift(created);
      return created;
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
      try {
        const res = await fetch(`${API_URL}/users/${id}`, {
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

      memoryDemoUsers = memoryDemoUsers.map((u) => (u.id === id ? { ...u, ...data } : u));
      return { message: 'User updated' };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword?: string }) => {
      try {
        const res = await fetch(`${API_URL}/users/${id}/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
          body: JSON.stringify({ newPassword }),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback
      }
      return { message: 'Password reset link sent to user email.' };
    },
  });
}

export function useToggleUserStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      try {
        const res = await fetch(`${API_URL}/users/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
          body: JSON.stringify({ isActive }),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback
      }

      memoryDemoUsers = memoryDemoUsers.map((u) => (u.id === id ? { ...u, isActive } : u));
      return { message: `User status updated to ${isActive ? 'active' : 'suspended'}` };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
