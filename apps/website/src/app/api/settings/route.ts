import { NextResponse } from 'next/server';
import { getWebsiteSettings, updateWebsiteSettings } from '@govcms/database';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const settings = await getWebsiteSettings();
  return NextResponse.json(settings, {
    headers: {
      'Cache-Control': 'no-store, max-age=0, must-revalidate',
    },
  });
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const updated = await updateWebsiteSettings(body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update settings' }, { status: 400 });
  }
}

export async function POST(req: Request) {
  return PUT(req);
}
