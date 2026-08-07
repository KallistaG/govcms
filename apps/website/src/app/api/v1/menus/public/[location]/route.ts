import { NextResponse } from 'next/server';
import { getSharedStore } from '../../../sync/store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ location: string }> }
) {
  const resolved = await params;
  const location = resolved.location.toUpperCase();
  const store = getSharedStore();

  try {
    const res = await fetch(`${API_URL}/menus/public/${location}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data) return NextResponse.json(data);
    }
  } catch {
    // fallback to sharedStore
  }

  const items = store.menus[location] || store.menus[location.replace('_MENU', '')] || [];
  return NextResponse.json({ location, items });
}
