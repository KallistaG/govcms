'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface SiteSettingsData {
  id?: string;
  siteName: string;
  websiteName?: string;
  tagline: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  keywords: string;
  email: string;
  phone: string;
  address: string;
  googleMaps?: string;
  googleMapsUrl?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    youtube?: string;
    instagram?: string;
    linkedin?: string;
  };
  facebook?: string;
  twitter?: string;
  youtube?: string;
  analyticsId?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpEncryption?: string;
  smtpSenderName?: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

const STORAGE_KEY = 'govcms_website_settings';

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  siteName: '',
  websiteName: '',
  tagline: '',
  description: '',
  seoTitle: '',
  seoDescription: '',
  keywords: 'government, public services, official portal',
  email: '',
  phone: '',
  address: '',
  googleMaps: '',
  googleMapsUrl: '',
  facebook: '',
  maintenanceMode: false,
  maintenanceMessage: 'The official agency portal is currently undergoing scheduled system maintenance. Please check back shortly.',
};

export function getLocalSettings(): SiteSettingsData {
  if (typeof window === 'undefined') return DEFAULT_SITE_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SITE_SETTINGS,
        ...parsed,
        siteName: parsed.siteName || parsed.websiteName || DEFAULT_SITE_SETTINGS.siteName,
        websiteName: parsed.siteName || parsed.websiteName || DEFAULT_SITE_SETTINGS.websiteName,
      };
    }
  } catch {
    // fallback
  }
  return DEFAULT_SITE_SETTINGS;
}

export function saveLocalSettings(data: Partial<SiteSettingsData>): SiteSettingsData {
  const current = getLocalSettings();
  const name = data.siteName || data.websiteName || current.siteName;
  const tag = data.tagline || data.description || current.tagline;

  const next: SiteSettingsData = {
    ...current,
    ...data,
    siteName: name,
    websiteName: name,
    tagline: tag,
    description: tag,
    seoTitle: data.seoTitle || name,
    seoDescription: data.seoDescription || tag,
    maintenanceMode: data.maintenanceMode !== undefined ? Boolean(data.maintenanceMode) : current.maintenanceMode,
    maintenanceMessage: data.maintenanceMessage !== undefined ? data.maintenanceMessage : current.maintenanceMessage,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      document.cookie = `govcms_website_settings=${encodeURIComponent(JSON.stringify(next))}; path=/; max-age=2592000; SameSite=Lax`;
    } catch {
      // fallback
    }
  }

  return next;
}

export function useSiteSettings() {
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: async (): Promise<SiteSettingsData> => {
      const local = getLocalSettings();
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' });
        if (res.ok) {
          const remote = await res.json();
          if (remote && (remote.siteName || remote.websiteName)) {
            const merged = saveLocalSettings(remote);
            return merged;
          }
        }
      } catch {
        // Fallback to local
      }
      return local;
    },
    initialData: getLocalSettings(),
  });
}

export function useUpdateSiteSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SiteSettingsData>) => {
      const updatedLocal = saveLocalSettings(data);

      const payload = {
        siteName: updatedLocal.siteName,
        websiteName: updatedLocal.websiteName,
        tagline: updatedLocal.tagline,
        description: updatedLocal.description,
        seoTitle: updatedLocal.seoTitle,
        seoDescription: updatedLocal.seoDescription,
        keywords: updatedLocal.keywords,
        email: updatedLocal.email,
        phone: updatedLocal.phone,
        address: updatedLocal.address,
        googleMaps: updatedLocal.googleMaps,
        facebook: updatedLocal.facebook,
        twitter: updatedLocal.twitter,
        youtube: updatedLocal.youtube,
        maintenanceMode: updatedLocal.maintenanceMode,
        maintenanceMessage: updatedLocal.maintenanceMessage,
      };

      try {
        const res = await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const remoteData = await res.json();
          return saveLocalSettings(remoteData);
        }
      } catch {
        // Use updated local
      }

      return updatedLocal;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['site-settings'], updated);
      queryClient.setQueryData(['public-site-settings'], updated);
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['public-site-settings'] });
    },
  });
}

export function usePublicSiteSettings() {
  return useSiteSettings();
}
