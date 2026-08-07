import { prisma } from './client';

export interface WebsiteSettingsDTO {
  id?: string;
  siteName?: string;
  tagline?: string;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string;
  logo?: string | null;
  favicon?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  email?: string;
  phone?: string;
  address?: string;
  googleMaps?: string;
  facebook?: string;
  twitter?: string;
  youtube?: string;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
}

export const DEFAULT_WEBSITE_SETTINGS: Required<Omit<WebsiteSettingsDTO, 'id' | 'logo' | 'favicon' | 'twitter' | 'youtube'>> & { logo: string | null; favicon: string | null; twitter: string | null; youtube: string | null } = {
  siteName: 'La Carlota City Water District',
  tagline: 'Providing safe, adequate, safe and potable water supply affordable to all.',
  seoTitle: 'La Carlota City Water District | Official Portal',
  seoDescription: 'Providing safe, adequate, safe and potable water supply affordable to all.',
  keywords: 'govcms, philippines, dict, government, public services, water district',
  logo: null,
  favicon: null,
  primaryColor: '#1d4ed8',
  secondaryColor: '#7c3aed',
  email: 'info@lacarlotawater.gov.ph',
  phone: '+63 (034) 460-2234',
  address: 'Gurrea St., La Carlota City, Negros Occidental, Philippines',
  googleMaps: 'https://maps.google.com/maps?q=La+Carlota+City+Negros+Occidental&t=&z=15&ie=UTF8&iwloc=&output=embed',
  facebook: 'https://facebook.com/LaCarlotaCityWaterDistrict',
  twitter: null,
  youtube: null,
  maintenanceMode: false,
  maintenanceMessage: 'The official agency portal is currently undergoing scheduled system maintenance. Please check back shortly.',
};

export async function getWebsiteSettings() {
  try {
    let settings = await prisma.websiteSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!settings) {
      settings = await prisma.websiteSettings.create({
        data: DEFAULT_WEBSITE_SETTINGS,
      });
    }

    return settings;
  } catch (error) {
    console.error('[getWebsiteSettings] Database query error:', error);
    return DEFAULT_WEBSITE_SETTINGS;
  }
}

export async function updateWebsiteSettings(data: WebsiteSettingsDTO) {
  try {
    let settings = await prisma.websiteSettings.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (settings) {
      return await prisma.websiteSettings.update({
        where: { id: settings.id },
        data: {
          siteName: data.siteName ?? settings.siteName,
          tagline: data.tagline ?? settings.tagline,
          seoTitle: data.seoTitle ?? settings.seoTitle,
          seoDescription: data.seoDescription ?? settings.seoDescription,
          keywords: data.keywords ?? settings.keywords,
          logo: data.logo !== undefined ? data.logo : settings.logo,
          favicon: data.favicon !== undefined ? data.favicon : settings.favicon,
          primaryColor: data.primaryColor ?? settings.primaryColor,
          secondaryColor: data.secondaryColor ?? settings.secondaryColor,
          email: data.email ?? settings.email,
          phone: data.phone ?? settings.phone,
          address: data.address ?? settings.address,
          googleMaps: data.googleMaps ?? settings.googleMaps,
          facebook: data.facebook ?? settings.facebook,
          twitter: data.twitter ?? settings.twitter,
          youtube: data.youtube ?? settings.youtube,
          maintenanceMode: data.maintenanceMode !== undefined ? data.maintenanceMode : settings.maintenanceMode,
          maintenanceMessage: data.maintenanceMessage ?? settings.maintenanceMessage,
        },
      });
    }

    return await prisma.websiteSettings.create({
      data: {
        siteName: data.siteName || DEFAULT_WEBSITE_SETTINGS.siteName,
        tagline: data.tagline || DEFAULT_WEBSITE_SETTINGS.tagline,
        seoTitle: data.seoTitle || DEFAULT_WEBSITE_SETTINGS.seoTitle,
        seoDescription: data.seoDescription || DEFAULT_WEBSITE_SETTINGS.seoDescription,
        keywords: data.keywords || DEFAULT_WEBSITE_SETTINGS.keywords,
        logo: data.logo || null,
        favicon: data.favicon || null,
        primaryColor: data.primaryColor || DEFAULT_WEBSITE_SETTINGS.primaryColor,
        secondaryColor: data.secondaryColor || DEFAULT_WEBSITE_SETTINGS.secondaryColor,
        email: data.email || DEFAULT_WEBSITE_SETTINGS.email,
        phone: data.phone || DEFAULT_WEBSITE_SETTINGS.phone,
        address: data.address || DEFAULT_WEBSITE_SETTINGS.address,
        googleMaps: data.googleMaps || DEFAULT_WEBSITE_SETTINGS.googleMaps,
        facebook: data.facebook || DEFAULT_WEBSITE_SETTINGS.facebook,
        twitter: data.twitter || null,
        youtube: data.youtube || null,
        maintenanceMode: data.maintenanceMode || false,
        maintenanceMessage: data.maintenanceMessage || DEFAULT_WEBSITE_SETTINGS.maintenanceMessage,
      },
    });
  } catch (error) {
    console.error('[updateWebsiteSettings] Database update error:', error);
    return { ...DEFAULT_WEBSITE_SETTINGS, ...data };
  }
}
