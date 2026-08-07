import { prisma, getWebsiteSettings as getDbWebsiteSettings } from '@govcms/database';

export async function getWebsiteSettings() {
  return await getDbWebsiteSettings();
}

export async function getPublicThemeFromDb() {
  try {
    let theme = await prisma.themeConfig.findFirst({
      where: { isActive: true, publishedAt: { not: null } },
      orderBy: { publishedAt: 'desc' },
    });

    if (!theme) {
      theme = await prisma.themeConfig.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' },
      });
    }

    if (theme) {
      return {
        websiteName: theme.websiteName,
        logoUrl: theme.logoUrl,
        faviconUrl: theme.faviconUrl,
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
        fontHeading: theme.fontHeading,
        fontBody: theme.fontBody,
      };
    }
  } catch (error) {
    console.error('[getPublicThemeFromDb] Database query error:', error);
  }

  const settings = await getWebsiteSettings();
  return {
    websiteName: settings.siteName,
    logoUrl: settings.logo,
    faviconUrl: settings.favicon,
    primaryColor: settings.primaryColor || '#1d4ed8',
    secondaryColor: settings.secondaryColor || '#7c3aed',
    fontHeading: 'Inter',
    fontBody: 'Inter',
  };
}

export async function getPublicMenuFromDb(locationInput: string) {
  const locUpper = String(locationInput || '').toUpperCase();
  let location: any = 'HEADER_MENU';
  if (locUpper.includes('FOOTER')) location = 'FOOTER_MENU';
  if (locUpper.includes('SIDEBAR')) location = 'SIDEBAR_MENU';

  try {
    const menu = await prisma.menu.findFirst({
      where: { location },
      include: {
        items: {
          where: { isVisible: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (menu && menu.items) {
      const buildTree = (items: any[], parentId: string | null = null): any[] => {
        return items
          .filter((item) => item.parentId === parentId)
          .sort((a, b) => a.order - b.order)
          .map((item) => ({
            ...item,
            children: buildTree(items, item.id),
          }));
      };

      return {
        id: menu.id,
        name: menu.name,
        location: menu.location,
        items: buildTree(menu.items, null),
      };
    }
  } catch (error) {
    console.error('[getPublicMenuFromDb] Database query error:', error);
  }

  return { location, items: [] };
}

export async function getPublicHomepageFromDb() {
  try {
    let config = await prisma.homepageConfig.findFirst({
      where: { isDraft: false },
      orderBy: { publishedAt: 'desc' },
    });

    if (!config) {
      config = await prisma.homepageConfig.findFirst({
        orderBy: { updatedAt: 'desc' },
      });
    }

    if (config) {
      const sections = (config.sections as unknown as any[]) || [];
      return {
        id: config.id,
        name: config.name,
        sections: sections.filter((s) => s.isVisible).sort((a, b) => a.order - b.order),
      };
    }
  } catch (error) {
    console.error('[getPublicHomepageFromDb] Database query error:', error);
  }

  return { sections: [] };
}
