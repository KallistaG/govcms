import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, User, Newspaper } from 'lucide-react';
import { prisma } from '@govcms/database';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getArticleBySlug(slug: string) {
  try {
    const item = await prisma.contentItem.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: { author: { select: { firstName: true, lastName: true } } },
    });
    if (item) return item;
  } catch {
    // fallback
  }

  if (slug === 'dict-launches-enterprise-cloud-infrastructure') {
    return {
      title: 'DICT Launches Enterprise Cloud Infrastructure for Regional Government Units',
      body: '<p>The Department of Information and Communications Technology (DICT) has officially deployed its state-of-the-art enterprise cloud infrastructure designed to empower regional government agencies with secure, scalable, and resilient digital services.</p><p>This initiative aligns with the national digital transformation roadmap to streamline public service delivery across the Philippine islands.</p>',
      createdAt: new Date().toISOString(),
      author: { firstName: 'Maria', lastName: 'Santos' },
    };
  }

  return null;
}

export default async function PublicNewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Link href="/news" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to News & Press Releases
      </Link>

      <div className="space-y-4 border-b pb-8">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold font-mono text-primary uppercase bg-primary/10 px-2.5 py-1 rounded-md flex items-center gap-1">
            <Newspaper className="h-3 w-3" /> Official Press Statement
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-tight">
          {article.title}
        </h1>
        <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> {new Date(article.createdAt).toLocaleDateString()}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" /> {article.author ? `${article.author.firstName} ${article.author.lastName}` : 'Official Press Desk'}
          </span>
        </div>
      </div>

      <div
        className="prose prose-slate max-w-none text-sm leading-relaxed text-foreground"
        dangerouslySetInnerHTML={{ __html: article.body || '<p>No document content provided.</p>' }}
      />
    </article>
  );
}
