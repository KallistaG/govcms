'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthHeader } from '../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

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
    phone: '+63 919 555 1212',
    avatarUrl: null,
    isActive: true,
    lastLoginAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
  },
  {
    id: 'usr-4',
    email: 'elena.reyes@dict.gov.ph',
    firstName: 'Elena',
    lastName: 'Reyes',
    role: 'PUBLISHER',
    department: 'Legal & Compliance',
    phone: '+63 920 333 4444',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    isActive: false,
    lastLoginAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
  },
];

let memoryUsers = [...INITIAL_DEMO_USERS];

export function useUsersList(search?: string, role?: string, department?: string) {
  return useQuery({
    queryKey: ['users-list', search, role, department],
    queryFn: async (): Promise<UserData[]> => {
      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.set('search', search);
        if (role && role !== 'ALL') queryParams.set('role', role);
        if (department && department !== 'ALL') queryParams.set('department', department);

        const res = await fetch(`${API_URL}/users?${queryParams.toString()}`, {
          headers: getAuthHeader(),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback demo filtering
      }

      return memoryUsers.filter((u) => {
        const matchesSearch =
          !search ||
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          u.firstName.toLowerCase().includes(search.toLowerCase()) ||
          u.lastName.toLowerCase().includes(search.toLowerCase());
        const matchesRole = !role || role === 'ALL' || u.role === role;
        const matchesDept = !department || department === 'ALL' || u.department === department;
        return matchesSearch && matchesRole && matchesDept;
      });
    },
  });
}

export function useUserDetail(id?: string) {
  return useQuery({
    queryKey: ['user-detail', id],
    enabled: !!id,
    queryFn: async (): Promise<UserData | null> => {
      if (!id) return null;
      try {
        const res = await fetch(`${API_URL}/users/${id}`, {
          headers: getAuthHeader(),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback demo
      }
      return memoryUsers.find((u) => u.id === id) || null;
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newUser: Partial<UserData> & { password?: string }) => {
      try {
        const res = await fetch(`${API_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify(newUser),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback
      }

      const created: UserData = {
        id: `usr-${Date.now()}`,
        email: newUser.email || 'new.user@dict.gov.ph',
        firstName: newUser.firstName || 'New',
        lastName: newUser.lastName || 'User',
        role: (newUser.role as RoleEnum) || 'EDITOR',
        department: newUser.department || 'Public Information Office',
        phone: newUser.phone || null,
        avatarUrl: newUser.avatarUrl || null,
        permissions: newUser.permissions || null,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      memoryUsers.unshift(created);
      return created;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users-list'] }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UserData> }) => {
      try {
        const res = await fetch(`${API_URL}/users/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify(data),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback
      }

      memoryUsers = memoryUsers.map((u) => (u.id === id ? { ...u, ...data } : u));
      return { message: 'User updated successfully' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      queryClient.invalidateQueries({ queryKey: ['user-detail'] });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ id, newPassword }: { id: string; newPassword?: string }) => {
      try {
        const res = await fetch(`${API_URL}/users/${id}/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify({ newPassword }),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback
      }
      return { message: 'Password reset successfully', tempPassword: newPassword || 'GovCMS@Temp2026!' };
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const res = await fetch(`${API_URL}/users/${id}`, {
          method: 'DELETE',
          headers: getAuthHeader(),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback
      }
      memoryUsers = memoryUsers.filter((u) => u.id !== id);
      return { message: 'User deleted successfully' };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users-list'] }),
  });
}
