import { NextResponse } from 'next/server';
import { prisma, getWebsiteSettings } from '@govcms/database';
import { getOrBootstrapAgency } from '../../../../lib/agency-bootstrap';

async function getOrCreateAgencyAndUser() {
  const agency = await getOrBootstrapAgency();
  let author = await prisma.user.findFirst();
  if (!author) {
    author = await prisma.user.create({
      data: {
        email: 'admin@gov.ph',
        passwordHash: '',
        firstName: 'Agency',
        lastName: 'Administrator',
        role: 'ADMINISTRATOR',
      },
    });
  }
  return { agency, author };
}

export async function GET() {
  try {
    let theme = await prisma.themeConfig.findFirst({ orderBy: { updatedAt: 'desc' } });
    if (!theme) {
      const settings = await getWebsiteSettings();
      const { agency, author } = await getOrCreateAgencyAndUser();
      theme = await prisma.themeConfig.create({
        data: {
          websiteName: settings.siteName || 'Government Agency Portal',
          primaryColor: settings.primaryColor || '#1d4ed8',
          secondaryColor: settings.secondaryColor || '#7c3aed',
          fontHeading: 'Inter',
          fontBody: 'Inter',
          isActive: true,
          agencyId: agency.id,
          authorId: author.id,
        },
      });
    }
    return NextResponse.json(theme);
  } catch (error) {
    console.error('[API_ERROR] GET /api/v1/theme:', error);
    return NextResponse.json({
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
      const settings = await getWebsiteSettings();
      const { agency, author } = await getOrCreateAgencyAndUser();
      updated = await prisma.themeConfig.create({
        data: {
          websiteName: settings.siteName || 'Government Agency Portal',
          primaryColor: body.primaryColor || settings.primaryColor || '#1d4ed8',
          secondaryColor: body.secondaryColor || settings.secondaryColor || '#7c3aed',
          fontHeading: body.fontHeading || 'Inter',
          fontBody: body.fontBody || 'Inter',
          isActive: true,
          agencyId: agency.id,
          authorId: author.id,
        },
      });
    }
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[API_ERROR] POST /api/v1/theme:', error);
    return NextResponse.json({ message: error?.message || 'Failed to update theme' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return POST(request);
}
