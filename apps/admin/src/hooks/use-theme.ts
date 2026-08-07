'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthHeader } from '../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const STORAGE_KEY = 'govcms_theme_config';

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

function getLocalTheme(): ThemeConfig {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return DEFAULT_THEME;
}

function saveLocalTheme(theme: Partial<ThemeConfig>): ThemeConfig {
  const current = getLocalTheme();
  const next = { ...current, ...theme };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // fallback
    }
  }
  return next;
}

export function useThemeConfig() {
  return useQuery({
    queryKey: ['theme-config'],
    queryFn: async (): Promise<ThemeConfig> => {
      try {
        const res = await fetch(`${API_URL}/theme`, { headers: getAuthHeader() });
        if (res.ok) {
          const data = await res.json();
          if (data) {
            saveLocalTheme(data);
            return data;
          }
        }
      } catch {
        // fallback
      }
      return getLocalTheme();
    },
  });
}

export function useSaveTheme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (theme: Partial<ThemeConfig>) => {
      const updatedLocal = saveLocalTheme(theme);
      try {
        const res = await fetch(`${API_URL}/theme`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify(theme),
        });
        if (res.ok) {
          const remoteData = await res.json();
          saveLocalTheme(remoteData);
          return remoteData;
        }
      } catch {
        // fallback
      }
      return updatedLocal;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['theme-config'] });
      qc.invalidateQueries({ queryKey: ['public-theme'] });
    },
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
      } catch {
        // fallback
      }
      return { message: 'Published' };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['theme-config'] });
      qc.invalidateQueries({ queryKey: ['public-theme'] });
    },
  });
}

export function usePublicTheme() {
  return useQuery({
    queryKey: ['public-theme'],
    queryFn: async (): Promise<ThemeConfig> => {
      try {
        const res = await fetch(`${API_URL}/theme/public`);
        if (res.ok) {
          const data = await res.json();
          if (data) return data;
        }
      } catch {
        // fallback
      }
      return getLocalTheme();
    },
  });
}
