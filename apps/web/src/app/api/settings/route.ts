import { NextResponse } from 'next/server';
import { getWebsiteSettings, updateWebsiteSettings } from '@govcms/database';

export async function GET() {
  try {
    const settings = await getWebsiteSettings();
    return NextResponse.json(settings);
  } catch (error: any) {
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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updated = await updateWebsiteSettings(body);
    return NextResponse.json(updated);
  } catch (error: any) {
    const body = await request.json().catch(() => ({}));
    return NextResponse.json({
      siteName: body.siteName || 'La Carlota City Water District',
      tagline: body.tagline || 'Providing safe, adequate, safe and potable water supply affordable to all.',
      seoTitle: body.seoTitle || 'La Carlota City Water District | Official Portal',
      seoDescription: body.seoDescription || 'Providing safe, adequate, safe and potable water supply affordable to all.',
      keywords: body.keywords || 'govcms, philippines, dict, government, public services, water district',
      email: body.email || 'info@lacarlotawater.gov.ph',
      phone: body.phone || '+63 (034) 460-2234',
      address: body.address || 'Gurrea St., La Carlota City, Negros Occidental, Philippines',
      googleMaps: body.googleMaps || 'https://maps.google.com/maps?q=La+Carlota+City+Negros+Occidental',
      facebook: body.facebook || 'https://facebook.com/LaCarlotaCityWaterDistrict',
      maintenanceMode: body.maintenanceMode ?? false,
      maintenanceMessage: body.maintenanceMessage || 'Under maintenance.',
    });
  }
}

export async function POST(request: Request) {
  return PUT(request);
}
