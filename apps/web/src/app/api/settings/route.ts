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
  } catch (error) {
    console.error('[API_ERROR] GET /api/settings:', error);
    // Return cookie-persisted settings if DB is unavailable, or minimal defaults
    return NextResponse.json(
      cookieSettings || {
        siteName: '',
        tagline: '',
        seoTitle: '',
        seoDescription: '',
        keywords: '',
        email: '',
        phone: '',
        address: '',
        googleMaps: '',
        facebook: '',
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
  } catch (error) {
    console.error('[API_ERROR] PUT /api/settings:', error);
    const body = await request.json().catch(() => ({}));
    // Echo back whatever the user submitted — they submitted it so it's their data
    const fallbackData = {
      siteName: body.siteName || '',
      websiteName: body.siteName || '',
      tagline: body.tagline || '',
      description: body.tagline || '',
      seoTitle: body.seoTitle || '',
      seoDescription: body.seoDescription || '',
      keywords: body.keywords || '',
      email: body.email || '',
      phone: body.phone || '',
      address: body.address || '',
      googleMaps: body.googleMaps || '',
      facebook: body.facebook || '',
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
