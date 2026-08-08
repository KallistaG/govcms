import { NextResponse } from 'next/server';
import { getWebsiteSettings } from '@govcms/database';

export async function GET() {
  try {
    const settings = await getWebsiteSettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed' }, { status: 500 });
  }
}
