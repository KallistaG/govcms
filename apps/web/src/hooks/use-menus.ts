'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthHeader } from '../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export interface MenuItemData {
  id: string;
  menuId: string;
  parentId?: string | null;
  title: string;
  url: string;
  icon?: string;
  isExternal?: boolean;
  openInNewTab?: boolean;
  isVisible?: boolean;
  order: number;
  children?: MenuItemData[];
}

export interface MenuData {
  id: string;
  name: string;
  code: string;
  location: 'HEADER_MENU' | 'FOOTER_MENU' | 'SIDEBAR_MENU';
  items?: MenuItemData[];
  tree?: MenuItemData[];
}

export function usePublicMenu(location: 'HEADER_MENU' | 'FOOTER_MENU' | 'SIDEBAR_MENU') {
  return useQuery({
    queryKey: ['menu', 'public', location],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_URL}/menus/public/${location}`);
        if (res.ok) return await res.json();
      } catch {
        // Fallback
      }
      return { location, items: [] };
    },
  });
}

export function useMenuByLocation(location: 'HEADER_MENU' | 'FOOTER_MENU' | 'SIDEBAR_MENU') {
  return useQuery({
    queryKey: ['menu', 'admin', location],
    queryFn: async (): Promise<MenuData> => {
      try {
        const res = await fetch(`${API_URL}/menus`, {
          headers: getAuthHeader(),
        });
        if (res.ok) {
          const menus: MenuData[] = await res.json();
          const target = menus.find((m) => m.location === location);
          if (target) {
            const detailRes = await fetch(`${API_URL}/menus/${target.id}`, {
              headers: getAuthHeader(),
            });
            if (detailRes.ok) return await detailRes.json();
          }
        }
      } catch {
        // Fallback
      }

      return {
        id: `menu-${location.toLowerCase()}`,
        name: location.replace('_', ' '),
        code: location.toLowerCase(),
        location,
        tree: [],
      };
    },
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newItem: Partial<MenuItemData>) => {
      const res = await fetch(`${API_URL}/menus/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(newItem),
      });

      if (!res.ok) {
        throw new Error('Failed to create menu item');
      }

      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MenuItemData> }) => {
      const res = await fetch(`${API_URL}/menus/items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error('Failed to update menu item');
      }

      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/menus/items/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });

      if (!res.ok) {
        throw new Error('Failed to delete menu item');
      }

      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
  });
}
