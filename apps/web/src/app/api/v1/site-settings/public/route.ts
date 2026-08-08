import { NextResponse } from 'next/server';
import { getWebsiteSettings } from '@govcms/database';

export async function GET() {
  try {
    const settings = await getWebsiteSettings();
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({
      siteName: 'La Carlota City Water District',
      tagline: 'Providing safe, adequate, safe and potable water supply affordable to all.',
      seoTitle: 'La Carlota City Water District | Official Portal',
      seoDescription: 'Providing safe, adequate, safe and potable water supply affordable to all.',
      keywords: 'govcms, philippines, dict, government, public services, water district',
      email: 'info@lacarlotawater.gov.ph',
      phone: '+63 (034) 460-2234',
      address: 'Gurrea St., La Carlota City, Negros Occidental, Philippines',
      googleMaps: 'https://maps.google.com/maps?q=La+Carlota+City+Negros+Occidental&t=&z=15&ie=UTF8&iwloc=&output=embed',
      facebook: 'https://facebook.com/LaCarlotaCityWaterDistrict',
      maintenanceMode: false,
      maintenanceMessage: 'The official agency portal is currently undergoing scheduled system maintenance.',
    });
  }
}
