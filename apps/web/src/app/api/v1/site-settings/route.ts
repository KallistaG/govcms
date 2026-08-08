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
    // Cookie parse error
  }

  try {
    const settings = await getWebsiteSettings();
    const merged = cookieSettings ? { ...settings, ...cookieSettings } : settings;
    return NextResponse.json(merged);
  } catch (error) {
    console.error('[API_ERROR] GET /api/v1/site-settings:', error);
    if (cookieSettings) {
      return NextResponse.json(cookieSettings);
    }
    return NextResponse.json({ message: 'Failed to fetch site settings' }, { status: 500 });
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
    console.error('[API_ERROR] PUT /api/v1/site-settings:', error);
    return NextResponse.json({ message: 'Failed to update website settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return PUT(request);
}
