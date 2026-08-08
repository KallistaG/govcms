import { NextResponse } from 'next/server';
import { getWebsiteSettings, updateWebsiteSettings } from '@govcms/database';

export async function GET(request: Request) {
  let cookieSettings: any = null;
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/govcms_website_settings=([^;]+)/);
    if (match && match[1]) {
      cookieSettings = JSON.parse(decodeURIComponent(match[1]));
    }
  } catch {
    // fallback
  }

  try {
    const settings = await getWebsiteSettings();
    const merged = cookieSettings ? { ...settings, ...cookieSettings } : settings;
    return NextResponse.json(merged);
  } catch {
    return NextResponse.json(
      cookieSettings || {
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
      }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updated = await updateWebsiteSettings(body);
    const response = NextResponse.json(updated);
    response.cookies.set('govcms_website_settings', JSON.stringify(updated), {
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
    });
    return response;
  } catch {
    const body = await request.json().catch(() => ({}));
    const fallbackData = {
      siteName: body.siteName || 'La Carlota City Water District',
      websiteName: body.siteName || 'La Carlota City Water District',
      tagline: body.tagline || 'Providing safe, adequate, safe and potable water supply affordable to all.',
      description: body.tagline || 'Providing safe, adequate, safe and potable water supply affordable to all.',
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
    };
    const response = NextResponse.json(fallbackData);
    response.cookies.set('govcms_website_settings', JSON.stringify(fallbackData), {
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
    });
    return response;
  }
}

export async function POST(request: Request) {
  return PUT(request);
}
