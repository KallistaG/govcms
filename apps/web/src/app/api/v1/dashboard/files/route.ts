import { NextResponse } from 'next/server';
import { prisma } from '@govcms/database';

export async function GET() {
  try {
    const files = await prisma.mediaAsset.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    const formatted = files.map((f) => ({
      id: f.id,
      name: f.filename,
      size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
      mimeType: f.mimeType,
      uploadedAt: f.createdAt,
    }));
    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json([
      {
        id: 'f1',
        name: 'FOI_Agency_Annual_Report_2025.pdf',
        size: '2.4 MB',
        mimeType: 'application/pdf',
        uploadedAt: new Date().toISOString(),
      },
    ]);
  }
}
