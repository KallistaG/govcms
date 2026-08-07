import { NextResponse } from 'next/server';
import { getSharedStore } from './store';

export async function GET() {
  const sharedStore = getSharedStore();
  return NextResponse.json(sharedStore);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, data } = body;
    const sharedStore = getSharedStore();

    if (type === 'site-settings') {
      sharedStore.settings = { ...sharedStore.settings, ...data };
    } else if (type === 'theme') {
      sharedStore.theme = { ...sharedStore.theme, ...data };
    } else if (type === 'homepage') {
      sharedStore.homepage = data;
    } else if (type === 'menus') {
      const { location, items } = data;
      sharedStore.menus[location] = items;
    } else if (type === 'pages') {
      const { slug, page } = data;
      sharedStore.pages[slug] = page;
    }

    return NextResponse.json({ success: true, store: sharedStore });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 400 });
  }
}
