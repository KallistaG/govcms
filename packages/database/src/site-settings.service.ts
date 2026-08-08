import { prisma } from './client';

export interface WebsiteSettingsDTO {
  id?: string;
  siteName?: string | null;
  websiteName?: string | null;
  tagline?: string | null;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  keywords?: string | null;
  logo?: string | null;
  favicon?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  googleMaps?: string | null;
  googleMapsUrl?: string | null;
  facebook?: string | null;
  twitter?: string | null;
  youtube?: string | null;
  maintenanceMode?: boolean;
  maintenanceMessage?: string | null;
}

export const DEFAULT_WEBSITE_SETTINGS: WebsiteSettingsDTO = {
  siteName: 'La Carlota City Water District',
  websiteName: 'La Carlota City Water District',
  tagline: 'Providing safe, adequate, safe and potable water supply affordable to all.',
  description: 'Providing safe, adequate, safe and potable water supply affordable to all.',
  seoTitle: 'La Carlota City Water District | Official Portal',
  seoDescription: 'Providing safe, adequate, safe and potable water supply affordable to all.',
  keywords: 'govcms, philippines, dict, government, public services, water district',
  primaryColor: '#1d4ed8',
  secondaryColor: '#7c3aed',
  email: 'info@lacarlotawater.gov.ph',
  phone: '+63 (034) 460-2234',
  address: 'Gurrea St., La Carlota City, Negros Occidental, Philippines',
  googleMaps: 'https://maps.google.com/maps?q=La+Carlota+City+Negros+Occidental&t=&z=15&ie=UTF8&iwloc=&output=embed',
  googleMapsUrl: 'https://maps.google.com/maps?q=La+Carlota+City+Negros+Occidental&t=&z=15&ie=UTF8&iwloc=&output=embed',
  facebook: 'https://facebook.com/LaCarlotaCityWaterDistrict',
  maintenanceMode: false,
  maintenanceMessage: 'The official agency portal is currently undergoing scheduled system maintenance. Please check back shortly.',
};

const globalStore = globalThis as unknown as {
  __govcms_website_settings?: WebsiteSettingsDTO;
};

export async function createDefaultWebsiteSettings(): Promise<WebsiteSettingsDTO> {
  const created = await prisma.websiteSettings.create({
    data: {
      siteName: DEFAULT_WEBSITE_SETTINGS.siteName || 'La Carlota City Water District',
      tagline: DEFAULT_WEBSITE_SETTINGS.tagline || '',
      seoTitle: DEFAULT_WEBSITE_SETTINGS.seoTitle || '',
      seoDescription: DEFAULT_WEBSITE_SETTINGS.seoDescription || '',
      keywords: DEFAULT_WEBSITE_SETTINGS.keywords || '',
      primaryColor: DEFAULT_WEBSITE_SETTINGS.primaryColor || '#1d4ed8',
      secondaryColor: DEFAULT_WEBSITE_SETTINGS.secondaryColor || '#7c3aed',
      email: DEFAULT_WEBSITE_SETTINGS.email || '',
      phone: DEFAULT_WEBSITE_SETTINGS.phone || '',
      address: DEFAULT_WEBSITE_SETTINGS.address || '',
      googleMaps: DEFAULT_WEBSITE_SETTINGS.googleMaps || '',
      facebook: DEFAULT_WEBSITE_SETTINGS.facebook || '',
      maintenanceMode: DEFAULT_WEBSITE_SETTINGS.maintenanceMode || false,
      maintenanceMessage: DEFAULT_WEBSITE_SETTINGS.maintenanceMessage || '',
    },
  });

  const result: any = {
    ...created,
    websiteName: created.siteName,
    description: created.tagline || created.seoDescription || '',
    googleMapsUrl: created.googleMaps || '',
  };

  globalStore.__govcms_website_settings = result;
  return result;
}

export async function getWebsiteSettings(): Promise<WebsiteSettingsDTO> {
  try {
    let settings = await prisma.websiteSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!settings) {
      try {
        settings = (await createDefaultWebsiteSettings()) as any;
      } catch {
        // DB uninitialized or fallback
      }
    }

    if (settings) {
      const result: any = {
        ...settings,
        websiteName: settings.siteName,
        description: settings.tagline || settings.seoDescription || '',
        googleMapsUrl: settings.googleMaps || '',
      };
      globalStore.__govcms_website_settings = result;
      return result;
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[DATABASE_ERROR] getWebsiteSettings failed:', error);
    }
  }

  return globalStore.__govcms_website_settings || DEFAULT_WEBSITE_SETTINGS;
}

export async function updateWebsiteSettings(data: WebsiteSettingsDTO): Promise<WebsiteSettingsDTO> {
  const current = globalStore.__govcms_website_settings || DEFAULT_WEBSITE_SETTINGS;
  const newSiteName = data.siteName || data.websiteName || current.siteName || 'La Carlota City Water District';
  const newTagline = data.tagline || data.description || current.tagline || '';

  const merged: WebsiteSettingsDTO = {
    ...current,
    ...data,
    siteName: newSiteName,
    websiteName: newSiteName,
    tagline: newTagline,
    description: newTagline,
    seoTitle: data.seoTitle || newSiteName,
    seoDescription: data.seoDescription || newTagline,
    keywords: data.keywords !== undefined ? data.keywords : current.keywords,
    email: data.email !== undefined ? data.email : current.email,
    phone: data.phone !== undefined ? data.phone : current.phone,
    address: data.address !== undefined ? data.address : current.address,
    googleMaps: data.googleMaps || data.googleMapsUrl || current.googleMaps,
    googleMapsUrl: data.googleMaps || data.googleMapsUrl || current.googleMapsUrl,
    facebook: data.facebook !== undefined ? data.facebook : current.facebook,
    maintenanceMode: data.maintenanceMode !== undefined ? Boolean(data.maintenanceMode) : current.maintenanceMode,
    maintenanceMessage: data.maintenanceMessage !== undefined ? data.maintenanceMessage : current.maintenanceMessage,
  };

  globalStore.__govcms_website_settings = merged;

  try {
    let settings = await prisma.websiteSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (settings) {
      const updated = await prisma.websiteSettings.update({
        where: { id: settings.id },
        data: {
          siteName: merged.siteName || 'La Carlota City Water District',
          tagline: merged.tagline || '',
          seoTitle: merged.seoTitle || '',
          seoDescription: merged.seoDescription || '',
          keywords: merged.keywords || '',
          logo: merged.logo || undefined,
          favicon: merged.favicon || undefined,
          primaryColor: merged.primaryColor || '#1d4ed8',
          secondaryColor: merged.secondaryColor || '#7c3aed',
          email: merged.email || '',
          phone: merged.phone || '',
          address: merged.address || '',
          googleMaps: merged.googleMaps || '',
          facebook: merged.facebook || '',
          twitter: merged.twitter || undefined,
          youtube: merged.youtube || undefined,
          maintenanceMode: Boolean(merged.maintenanceMode),
          maintenanceMessage: merged.maintenanceMessage || '',
        },
      });
      const result: any = {
        ...updated,
        websiteName: updated.siteName,
        description: updated.tagline || updated.seoDescription || '',
        googleMapsUrl: updated.googleMaps || '',
      };
      globalStore.__govcms_website_settings = result;
      return result;
    } else {
      const created = await prisma.websiteSettings.create({
        data: {
          siteName: merged.siteName || 'La Carlota City Water District',
          tagline: merged.tagline || '',
          seoTitle: merged.seoTitle || '',
          seoDescription: merged.seoDescription || '',
          keywords: merged.keywords || '',
          primaryColor: merged.primaryColor || '#1d4ed8',
          secondaryColor: merged.secondaryColor || '#7c3aed',
          email: merged.email || '',
          phone: merged.phone || '',
          address: merged.address || '',
          googleMaps: merged.googleMaps || '',
          facebook: merged.facebook || '',
          maintenanceMode: Boolean(merged.maintenanceMode),
          maintenanceMessage: merged.maintenanceMessage || '',
        },
      });
      const result: any = {
        ...created,
        websiteName: created.siteName,
        description: created.tagline || created.seoDescription || '',
        googleMapsUrl: created.googleMaps || '',
      };
      globalStore.__govcms_website_settings = result;
      return result;
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[DATABASE_ERROR] updateWebsiteSettings failed:', error);
    }
  }

  return merged;
}
