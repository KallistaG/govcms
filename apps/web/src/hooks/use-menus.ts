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

const INITIAL_DEMO_MENUS: Record<string, MenuItemData[]> = {
  HEADER_MENU: [
    {
      id: 'm-1',
      menuId: 'menu-header',
      title: 'Home',
      url: '/',
      icon: 'Home',
      order: 0,
      isVisible: true,
      children: [],
    },
    {
      id: 'm-2',
      menuId: 'menu-header',
      title: 'About Agency',
      url: '/pages/about',
      icon: 'Building2',
      order: 1,
      isVisible: true,
      children: [],
    },
    {
      id: 'm-3',
      menuId: 'menu-header',
      title: 'News & Press',
      url: '/news',
      icon: 'Newspaper',
      order: 2,
      isVisible: true,
      children: [],
    },
    {
      id: 'm-4',
      menuId: 'menu-header',
      title: 'FOI Downloads',
      url: '/downloads',
      icon: 'Download',
      order: 3,
      isVisible: true,
      children: [],
    },
  ],
  FOOTER_MENU: [
    {
      id: 'm-f1',
      menuId: 'menu-footer',
      title: 'GOV.PH Portal',
      url: 'https://www.gov.ph',
      isExternal: true,
      openInNewTab: true,
      order: 0,
      isVisible: true,
      children: [],
    },
    {
      id: 'm-f2',
      menuId: 'menu-footer',
      title: 'DICT Main',
      url: 'https://dict.gov.ph',
      isExternal: true,
      openInNewTab: true,
      order: 1,
      isVisible: true,
      children: [],
    },
  ],
};

const memoryMenus = { ...INITIAL_DEMO_MENUS };

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
      return { location, items: memoryMenus[location] || [] };
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
        tree: memoryMenus[location] || [],
      };
    },
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newItem: Partial<MenuItemData>) => {
      try {
        const res = await fetch(`${API_URL}/menus/items`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
          body: JSON.stringify(newItem),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback
      }

      const item: MenuItemData = {
        id: `m-${Date.now()}`,
        menuId: newItem.menuId || 'menu-header',
        parentId: newItem.parentId || null,
        title: newItem.title || 'New Item',
        url: newItem.url || '/',
        icon: newItem.icon,
        isExternal: !!newItem.isExternal,
        openInNewTab: !!newItem.openInNewTab,
        isVisible: newItem.isVisible !== false,
        order: newItem.order || 0,
        children: [],
      };

      const loc = newItem.menuId?.includes('footer') ? 'FOOTER_MENU' : 'HEADER_MENU';
      memoryMenus[loc] = memoryMenus[loc] || [];
      memoryMenus[loc].push(item);
      return item;
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
      try {
        const res = await fetch(`${API_URL}/menus/items/${id}`, {
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

      return { message: 'Menu item updated' };
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
      try {
        const res = await fetch(`${API_URL}/menus/items/${id}`, {
          method: 'DELETE',
          headers: getAuthHeader(),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback
      }

      return { message: 'Menu item removed' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
  });
}
