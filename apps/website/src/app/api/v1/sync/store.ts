// Shared state for public website Vercel deployment
const sharedStore: Record<string, any> = {
  settings: {
    websiteName: 'La Carlota City Water District',
    description: 'Providing safe, adequate, safe and potable water supply affordable to all.',
    keywords: 'govcms, philippines, dict, government, public services, water district',
    email: 'info@lacarlotawater.gov.ph',
    phone: '+63 (034) 460-2234',
    address: 'Gurrea St., La Carlota City, Negros Occidental, Philippines',
    googleMapsUrl: 'https://maps.google.com/maps?q=La+Carlota+City+Negros+Occidental&t=&z=15&ie=UTF8&iwloc=&output=embed',
    socialLinks: { facebook: 'https://facebook.com/LaCarlotaCityWaterDistrict' },
    analyticsId: 'G-GOVCMS2026',
    maintenanceMode: false,
    maintenanceMessage: 'The official agency portal is currently undergoing scheduled system maintenance.',
  },
  theme: {
    websiteName: 'La Carlota City Water District',
    primaryColor: '#1d4ed8',
    secondaryColor: '#7c3aed',
  },
  homepage: null,
  menus: {},
  pages: {},
};

export function getSharedStore() {
  return sharedStore;
}
