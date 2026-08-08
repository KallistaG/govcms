import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FileText, ArrowLeft } from 'lucide-react';
import { prisma } from '@govcms/database';

export const dynamic = 'force-dynamic';

async function getCustomPage(slug: string) {
  try {
    const item = await prisma.contentItem.findFirst({
      where: { slug, type: 'PAGE_DOCUMENT', status: 'PUBLISHED' },
    });
    if (item) return item;
  } catch {
    // fallback
  }

  if (slug === 'about') {
    return {
      title: 'About the Agency & Executive Mandate',
      body: '<h3>Agency Overview</h3><p>The agency operates as the primary government entity responsible for planning, developing, and promoting the national digital transformation agenda.</p><h3>Core Services</h3><p>Providing reliable digital infrastructure, cybersecurity frameworks, and public e-services for all citizens.</p>',
      createdAt: new Date().toISOString(),
    };
  }

  return null;
}

export default async function CustomDynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pageData = await getCustomPage(slug);

  if (!pageData) notFound();

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Return to Home Portal
      </Link>

      <div className="space-y-4 border-b pb-8">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold font-mono text-primary uppercase bg-primary/10 px-2.5 py-1 rounded-md flex items-center gap-1">
            <FileText className="h-3 w-3" /> Official Document
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-tight">
          {pageData.title}
        </h1>
      </div>

      <div
        className="prose prose-slate max-w-none text-sm leading-relaxed text-foreground"
        dangerouslySetInnerHTML={{ __html: pageData.body || '<p>Content document under review.</p>' }}
      />
    </article>
  );
}
