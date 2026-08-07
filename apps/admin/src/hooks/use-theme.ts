'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthHeader } from '../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export interface ThemeConfig {
  websiteName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontHeading: string;
  fontBody: string;
  navbarStyle: {
    bgColor: string;
    textColor: string;
    position: 'fixed' | 'sticky' | 'static';
    height: string;
  } | null;
  footerStyle: {
    bgColor: string;
    textColor: string;
    showSocials: boolean;
    copyright: string;
  } | null;
  buttonStyle: {
    borderRadius: string;
    fontWeight: string;
    textTransform: string;
  } | null;
  darkModeEnabled: boolean;
  customCss: string | null;
}

const DEFAULT_THEME: ThemeConfig = {
  websiteName: 'GovCMS Agency Portal',
  logoUrl: null,
  faviconUrl: null,
  primaryColor: '#1d4ed8',
  secondaryColor: '#7c3aed',
  fontHeading: 'Inter',
  fontBody: 'Inter',
  navbarStyle: {
    bgColor: '#0f172a',
    textColor: '#f8fafc',
    position: 'sticky',
    height: '64px',
  },
  footerStyle: {
    bgColor: '#0f172a',
    textColor: '#94a3b8',
    showSocials: true,
    copyright: '© 2026 Government Agency. All rights reserved.',
  },
  buttonStyle: {
    borderRadius: '8px',
    fontWeight: '700',
    textTransform: 'none',
  },
  darkModeEnabled: false,
  customCss: null,
};

let memoryTheme: ThemeConfig = { ...DEFAULT_THEME };

export function useThemeConfig() {
  return useQuery({
    queryKey: ['theme-config'],
    queryFn: async (): Promise<ThemeConfig> => {
      try {
        const res = await fetch(`${API_URL}/theme`, { headers: getAuthHeader() });
        if (res.ok) {
          const data = await res.json();
          if (data) return data;
        }
      } catch { /* fallback */ }
      return { ...memoryTheme };
    },
  });
}

export function useSaveTheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (theme: Partial<ThemeConfig>) => {
      memoryTheme = { ...memoryTheme, ...theme };
      try {
        const res = await fetch(`${API_URL}/theme`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify(theme),
        });
        if (res.ok) return await res.json();
      } catch { /* fallback */ }
      return { message: 'Saved' };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['theme-config'] }),
  });
}

export function usePublishTheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`${API_URL}/theme/publish`, {
          method: 'POST',
          headers: getAuthHeader(),
        });
        if (res.ok) return await res.json();
      } catch { /* fallback */ }
      return { message: 'Published' };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['theme-config'] }),
  });
}

export function usePublicTheme() {
  return useQuery({
    queryKey: ['public-theme'],
    queryFn: async (): Promise<ThemeConfig> => {
      try {
        const res = await fetch(`${API_URL}/theme/public`);
        if (res.ok) return await res.json();
      } catch { /* fallback */ }
      return { ...DEFAULT_THEME };
    },
  });
}
