import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const folderId = searchParams.get('folderId') || undefined;
  const search = searchParams.get('search') || '';
  const mimeType = searchParams.get('mimeType') || '';

  const where: any = {};
  if (folderId) where.folderId = folderId;
  if (search) {
    where.OR = [
      { filename: { contains: search, mode: 'insensitive' } },
      { altText: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (mimeType && mimeType !== 'all') {
    if (mimeType === 'image') where.mimeType = { startsWith: 'image/' };
    else if (mimeType === 'document') where.mimeType = { contains: 'pdf' };
    else if (mimeType === 'video') where.mimeType = { startsWith: 'video/' };
  }

  try {
    const assets = await prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { uploadedBy: { select: { firstName: true, lastName: true } } },
    });
    const formatted = assets.map((a) => ({
      ...a,
      uploadedByName: a.uploadedBy ? `${a.uploadedBy.firstName} ${a.uploadedBy.lastName}` : 'Official Admin',
    }));
    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json([
      {
        id: 'med-1',
        filename: 'National_Digital_Infrastructure_Roadmap.pdf',
        originalName: 'National_Digital_Infrastructure_Roadmap.pdf',
        mimeType: 'application/pdf',
        size: 3450000,
        url: '/files/National_Digital_Infrastructure_Roadmap.pdf',
        altText: 'National Digital Infrastructure Roadmap Document',
        uploadedByName: 'Maria Santos',
        createdAt: new Date().toISOString(),
      },
    ]);
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderId = formData.get('folderId') as string;
    const altText = formData.get('altText') as string;

    const filename = file ? file.name : `asset-${Date.now()}.png`;
    const mimeType = file ? file.type : 'image/png';
    const size = file ? file.size : 1024 * 500;
    const url = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop';

    const user = await prisma.user.findFirst();
    const agency = await prisma.agency.findFirst();

    const created = await prisma.mediaAsset.create({
      data: {
        filename,
        originalName: filename,
        mimeType,
        size,
        url,
        altText: altText || filename,
        folderId: folderId || null,
        uploadedById: user?.id || 'demo-user',
        agencyId: agency?.id || 'demo-agency',
      },
    });

    return NextResponse.json(created);
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Upload failed' }, { status: 500 });
  }
}
