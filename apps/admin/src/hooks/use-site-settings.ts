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

export function useSiteSettings() {
  return useQuery({
    queryKey: ['site-settings'],
    queryFn: async (): Promise<SiteSettingsData> => {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          return {
            ...data,
            websiteName: data.siteName || data.websiteName,
            description: data.tagline || data.seoDescription || data.description,
            googleMapsUrl: data.googleMaps || data.googleMapsUrl,
            socialLinks: {
              facebook: data.facebook || data.socialLinks?.facebook,
              twitter: data.twitter || data.socialLinks?.twitter,
              youtube: data.youtube || data.socialLinks?.youtube,
            },
          };
        }
      } catch {
        // Fallback
      }
      const res = await fetch('/api/settings');
      return await res.json();
    },
  });
}

export function useUpdateSiteSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SiteSettingsData>) => {
      const payload = {
        siteName: data.siteName || data.websiteName,
        tagline: data.tagline || data.description,
        seoTitle: data.seoTitle || data.siteName || data.websiteName,
        seoDescription: data.seoDescription || data.description || data.tagline,
        keywords: data.keywords,
        email: data.email,
        phone: data.phone,
        address: data.address,
        googleMaps: data.googleMaps || data.googleMapsUrl,
        facebook: data.facebook || data.socialLinks?.facebook,
        twitter: data.twitter || data.socialLinks?.twitter,
        youtube: data.youtube || data.socialLinks?.youtube,
        maintenanceMode: data.maintenanceMode,
        maintenanceMessage: data.maintenanceMessage,
      };

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Failed to update settings in PostgreSQL database');
      }

      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['public-site-settings'] });
    },
  });
}

export function usePublicSiteSettings() {
  return useSiteSettings();
}
