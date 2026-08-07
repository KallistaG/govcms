'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthHeader } from '../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

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
      url: '/about',
      icon: 'Building2',
      order: 1,
      isVisible: true,
      children: [
        {
          id: 'm-2-1',
          menuId: 'menu-header',
          parentId: 'm-2',
          title: 'Mandate & Vision',
          url: '/about/mandate',
          icon: 'Award',
          order: 0,
          isVisible: true,
        },
        {
          id: 'm-2-2',
          menuId: 'menu-header',
          parentId: 'm-2',
          title: 'Executive Officials',
          url: '/about/officials',
          icon: 'Users',
          order: 1,
          isVisible: true,
        },
      ],
    },
    {
      id: 'm-3',
      menuId: 'menu-header',
      title: 'Press Releases',
      url: '/news',
      icon: 'Newspaper',
      order: 2,
      isVisible: true,
      children: [],
    },
    {
      id: 'm-4',
      menuId: 'menu-header',
      title: 'DICT Portal (External)',
      url: 'https://dict.gov.ph',
      icon: 'Globe',
      isExternal: true,
      openInNewTab: true,
      order: 3,
      isVisible: true,
      children: [],
    },
  ],
  FOOTER_MENU: [
    {
      id: 'f-1',
      menuId: 'menu-footer',
      title: 'Privacy Policy',
      url: '/privacy',
      icon: 'ShieldCheck',
      order: 0,
      isVisible: true,
    },
    {
      id: 'f-2',
      menuId: 'menu-footer',
      title: 'Terms of Service',
      url: '/terms',
      icon: 'FileText',
      order: 1,
      isVisible: true,
    },
    {
      id: 'f-3',
      menuId: 'menu-footer',
      title: 'Freedom of Information (FOI)',
      url: 'https://foi.gov.ph',
      icon: 'ExternalLink',
      isExternal: true,
      openInNewTab: true,
      order: 2,
      isVisible: true,
    },
  ],
  SIDEBAR_MENU: [
    {
      id: 's-1',
      menuId: 'menu-sidebar',
      title: 'Dashboard Overview',
      url: '/dashboard',
      icon: 'LayoutDashboard',
      order: 0,
      isVisible: true,
    },
    {
      id: 's-2',
      menuId: 'menu-sidebar',
      title: 'Content Items',
      url: '/content',
      icon: 'FileText',
      order: 1,
      isVisible: true,
    },
  ],
};

const memoryMenuData = { ...INITIAL_DEMO_MENUS };

export function usePublicMenu(location: 'HEADER_MENU' | 'FOOTER_MENU' | 'SIDEBAR_MENU') {
  return useQuery({
    queryKey: ['public-menu', location],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_URL}/menus/public/${location}`);
        if (res.ok) return await res.json();
      } catch {
        // Fallback
      }
      return {
        location,
        items: memoryMenuData[location] || [],
      };
    },
  });
}

export function useMenuDetails(location: 'HEADER_MENU' | 'FOOTER_MENU' | 'SIDEBAR_MENU') {
  return useQuery({
    queryKey: ['menu-details', location],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_URL}/menus`, {
          headers: getAuthHeader(),
        });
        if (res.ok) {
          const menus = await res.json();
          const target = menus.find((m: MenuData) => m.location === location);
          if (target) {
            const detailRes = await fetch(`${API_URL}/menus/${target.id}`, {
              headers: getAuthHeader(),
            });
            if (detailRes.ok) return await detailRes.json();
          }
        }
      } catch {
        // Fallback demo menu
      }
      return {
        id: `demo-${location}`,
        name: `${location.replace('_', ' ')}`,
        code: location.toLowerCase(),
        location,
        tree: memoryMenuData[location] || [],
      };
    },
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newItem: Partial<MenuItemData> & { location: string }) => {
      try {
        const res = await fetch(`${API_URL}/menus/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify(newItem),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback demo creation
      }

      const loc = newItem.location as keyof typeof memoryMenuData;
      const createdItem: MenuItemData = {
        id: `item-${Date.now()}`,
        menuId: `menu-${loc}`,
        parentId: newItem.parentId || null,
        title: newItem.title || 'New Navigation Link',
        url: newItem.url || '/',
        icon: newItem.icon || 'Link',
        isExternal: newItem.isExternal || false,
        openInNewTab: newItem.openInNewTab || false,
        isVisible: newItem.isVisible ?? true,
        order: (memoryMenuData[loc] || []).length,
      };

      if (!createdItem.parentId) {
        memoryMenuData[loc].push(createdItem);
      } else {
        const addToParent = (tree: MenuItemData[]): boolean => {
          for (const node of tree) {
            if (node.id === createdItem.parentId) {
              if (!node.children) node.children = [];
              node.children.push(createdItem);
              return true;
            }
            if (node.children && addToParent(node.children)) return true;
          }
          return false;
        };
        addToParent(memoryMenuData[loc]);
      }

      return createdItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-details'] });
      queryClient.invalidateQueries({ queryKey: ['public-menu'] });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      location,
      data,
    }: {
      id: string;
      location: string;
      data: Partial<MenuItemData>;
    }) => {
      try {
        const res = await fetch(`${API_URL}/menus/items/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify(data),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback demo update
      }

      const loc = location as keyof typeof memoryMenuData;
      const updateNode = (tree: MenuItemData[]): boolean => {
        for (let i = 0; i < tree.length; i++) {
          if (tree[i].id === id) {
            tree[i] = { ...tree[i], ...data };
            return true;
          }
          if (tree[i].children && updateNode(tree[i].children!)) return true;
        }
        return false;
      };
      updateNode(memoryMenuData[loc]);

      return { message: 'Updated menu item' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-details'] });
      queryClient.invalidateQueries({ queryKey: ['public-menu'] });
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, location }: { id: string; location: string }) => {
      try {
        const res = await fetch(`${API_URL}/menus/items/${id}`, {
          method: 'DELETE',
          headers: getAuthHeader(),
        });
        if (res.ok) return await res.json();
      } catch {
        // Fallback demo delete
      }

      const loc = location as keyof typeof memoryMenuData;
      const deleteNode = (tree: MenuItemData[]): MenuItemData[] => {
        return tree
          .filter((node) => node.id !== id)
          .map((node) => ({
            ...node,
            children: node.children ? deleteNode(node.children) : [],
          }));
      };
      memoryMenuData[loc] = deleteNode(memoryMenuData[loc]);

      return { message: 'Deleted menu item' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-details'] });
      queryClient.invalidateQueries({ queryKey: ['public-menu'] });
    },
  });
}

export function useReorderMenuItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      location,
      newTree,
    }: {
      location: string;
      newTree: MenuItemData[];
    }) => {
      const loc = location as keyof typeof memoryMenuData;
      memoryMenuData[loc] = newTree;
      return { message: 'Menu items reordered' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-details'] });
      queryClient.invalidateQueries({ queryKey: ['public-menu'] });
    },
  });
}
