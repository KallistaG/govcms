'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthHeader } from '../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const STORAGE_KEY = 'govcms_site_settings';

export interface SiteSettingsData {
  websiteName: string;
  description: string;
  keywords: string;
  email: string;
  phone: string;
  address: string;
  googleMapsUrl: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    youtube?: string;
    instagram?: string;
    linkedin?: string;
  };
  analyticsId: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword?: string;
  smtpEncryption: string;
  smtpSenderName: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

const DEFAULT_SETTINGS: SiteSettingsData = {
  websiteName: 'Department of Information and Communications Technology',
  description: 'Official government portal for public services, press releases, executive orders, and agency updates.',
  keywords: 'govcms, philippines, dict, government, public services',
  email: 'info@dict.gov.ph',
  phone: '+63 (02) 8920-0101',
  address: 'DICT Building, C.P. Garcia Ave., Diliman, Quezon City, 1101 Philippines',
  googleMapsUrl: 'https://maps.google.com/maps?q=DICT+Quezon+City&t=&z=15&ie=UTF8&iwloc=&output=embed',
  socialLinks: {
    facebook: 'https://facebook.com/DICTgovph',
    twitter: 'https://twitter.com/DICTgovph',
    youtube: 'https://youtube.com/DICTgovph',
    instagram: 'https://instagram.com/DICTgovph',
    linkedin: 'https://linkedin.com/company/dictgovph',
  },
  analyticsId: 'G-GOVCMS2026',
  smtpHost: 'smtp.gov.ph',
  smtpPort: 587,
  smtpUser: 'notifications@dict.gov.ph',
  smtpPassword: '••••••••••••',
  smtpEncryption: 'TLS',
  smtpSenderName: 'GovCMS System Notifications',
  maintenanceMode: false,
  maintenanceMessage: 'The official agency portal is currently undergoing scheduled system maintenance. Please check back shortly.',
};

function getLocalSettings(): SiteSettingsData {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return DEFAULT_SETTINGS;
}

function saveLocalSettings(data: Partial<SiteSettingsData>): SiteSettingsData {
  const current = getLocalSettings();
  const next = { ...current, ...data };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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
      try {
        const res = await fetch(`${API_URL}/site-settings`, {
          headers: getAuthHeader(),
        });
        if (res.ok) {
          const remoteData = await res.json();
          if (remoteData) {
            saveLocalSettings(remoteData);
            return remoteData;
          }
        }
      } catch {
        // Fallback
      }
      return getLocalSettings();
    },
  });
}

export function useUpdateSiteSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<SiteSettingsData>) => {
      const updatedLocal = saveLocalSettings(data);
      try {
        const res = await fetch(`${API_URL}/site-settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const remoteRes = await res.json();
          saveLocalSettings(remoteRes);
          return remoteRes;
        }
      } catch {
        // Fallback
      }
      return updatedLocal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['public-site-settings'] });
    },
  });
}

export function usePublicSiteSettings() {
  return useQuery({
    queryKey: ['public-site-settings'],
    queryFn: async (): Promise<SiteSettingsData> => {
      try {
        const res = await fetch(`${API_URL}/site-settings/public`);
        if (res.ok) {
          const remoteData = await res.json();
          if (remoteData) return remoteData;
        }
      } catch {
        // Fallback
      }
      return getLocalSettings();
    },
  });
}
