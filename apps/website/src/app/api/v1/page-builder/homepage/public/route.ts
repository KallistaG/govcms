import { NextResponse } from 'next/server';
import { getSharedStore } from '../../../sync/store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function GET() {
  const store = getSharedStore();

  try {
    const res = await fetch(`${API_URL}/page-builder/homepage/public`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.sections) return NextResponse.json(data);
    }
  } catch {
    // fallback to sharedStore
  }

  return NextResponse.json(store.homepage || { sections: [] });
}
