import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';

export async function GET() {
  try {
    const theme = await prisma.themeConfig.findFirst({ orderBy: { updatedAt: 'desc' } });
    if (theme) return NextResponse.json(theme);
  } catch {
    // fallback
  }
  return NextResponse.json({
    id: 'theme-demo',
    primaryColor: '#1d4ed8',
    secondaryColor: '#7c3aed',
    fontHeading: 'Inter',
    fontBody: 'Inter',
    isActive: true,
  });
}
