import { prisma, getWebsiteSettings } from '@govcms/database';

/**
 * Gets the first agency from the database, creating a generic bootstrap
 * one if none exists. The bootstrap values are intentionally generic and
 * MUST be updated via the Admin → Settings before go-live.
 *
 * No organization-specific branding is hardcoded here. This function
 * is called at bootstrap time to ensure a valid Agency FK exists.
 */
export async function getOrBootstrapAgency() {
  let agency = await prisma.agency.findFirst({ orderBy: { createdAt: 'asc' } });

  if (!agency) {
    // Derive bootstrap name from database settings, falling back to a
    // fully generic placeholder that admins must replace.
    let siteName = 'Government Agency';
    let siteCode = 'GOV';
    let siteSlug = 'gov-agency';

    try {
      const settings = await getWebsiteSettings();
      if (settings.siteName) {
        siteName = settings.siteName;
        siteCode = settings.siteName
          .split(' ')
          .map((w: string) => w[0])
          .join('')
          .toUpperCase()
          .substring(0, 8);
        siteSlug = settings.siteName.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50);
      }
    } catch {
      // Use generic placeholder — admin must configure via Settings
    }

    agency = await prisma.agency.create({
      data: { name: siteName, code: siteCode, slug: siteSlug },
    });
  }

  return agency;
}
