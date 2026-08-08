import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';

export async function GET() {
  try {
    let theme = await prisma.themeConfig.findFirst({ orderBy: { updatedAt: 'desc' } });
    if (!theme) {
      const agency = await prisma.agency.findFirst();
      const author = await prisma.user.findFirst();
      theme = await prisma.themeConfig.create({
        data: {
          websiteName: 'GovCMS Agency Portal',
          primaryColor: '#1d4ed8',
          secondaryColor: '#7c3aed',
          fontHeading: 'Inter',
          fontBody: 'Inter',
          isActive: true,
          agencyId: agency?.id || 'demo-agency',
          authorId: author?.id || 'demo-author',
        },
      });
    }
    return NextResponse.json(theme);
  } catch {
    return NextResponse.json({
      id: 'theme-demo',
      primaryColor: '#1d4ed8',
      secondaryColor: '#7c3aed',
      fontHeading: 'Inter',
      fontBody: 'Inter',
      isActive: true,
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const existing = await prisma.themeConfig.findFirst({ orderBy: { updatedAt: 'desc' } });
    let updated;
    if (existing) {
      updated = await prisma.themeConfig.update({
        where: { id: existing.id },
        data: {
          primaryColor: body.primaryColor,
          secondaryColor: body.secondaryColor,
          fontHeading: body.fontHeading,
          fontBody: body.fontBody,
        },
      });
    } else {
      const agency = await prisma.agency.findFirst();
      const author = await prisma.user.findFirst();
      updated = await prisma.themeConfig.create({
        data: {
          websiteName: 'GovCMS Agency Portal',
          primaryColor: body.primaryColor || '#1d4ed8',
          secondaryColor: body.secondaryColor || '#7c3aed',
          fontHeading: body.fontHeading || 'Inter',
          fontBody: body.fontBody || 'Inter',
          isActive: true,
          agencyId: agency?.id || 'demo-agency',
          authorId: author?.id || 'demo-author',
        },
      });
    }
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed' }, { status: 500 });
  }
}
