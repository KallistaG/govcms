import { NextResponse } from 'next/server';
import { getWebsiteSettings, updateWebsiteSettings } from '@govcms/database';

export async function GET() {
  try {
    const settings = await getWebsiteSettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updated = await updateWebsiteSettings(body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed' }, { status: 500 });
  }
}
