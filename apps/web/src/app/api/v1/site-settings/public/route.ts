import { NextResponse } from 'next/server';
import { getWebsiteSettings } from '@govcms/database';

export async function GET() {
  try {
    const settings = await getWebsiteSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('[API_ERROR] /api/v1/site-settings/public:', error);
    return NextResponse.json(
      { message: 'Unable to load public website settings' },
      { status: 500 }
    );
  }
}
