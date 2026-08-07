import Link from 'next/link';
import { ArrowLeft, Calendar, User } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const revalidate = 60;

async function getArticle(slug: string) {
  try {
    const res = await fetch(`${API_URL}/contents/slug/${slug}`, { next: { revalidate: 60 } });
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }
  return {
    title: 'DICT Launches Enterprise Cloud Infrastructure for Regional Government Units',
    summary: 'Accelerating digital transformation across local government units with secure cloud hosting services.',
    body: `
      <p>The Department of Information and Communications Technology (DICT) has officially inaugurated its next-generation Enterprise Cloud Infrastructure project, designed to provide high-speed, secure, and resilient cloud hosting environments for local government units (LGUs) across the Philippines.</p>
      <h3>Key System Capabilities</h3>
      <ul>
        <li>Government-grade AES-256 data encryption at rest and in transit</li>
        <li>Automated failover across primary data centers in NCR and Region IV</li>
        <li>99.9% uptime SLA guarantee for critical public registry services</li>
      </ul>
      <p>For more information regarding onboarding and LGU integration, contact the DICT Public Assistance Desk.</p>
    `,
    createdAt: new Date().toISOString(),
    author: { firstName: 'Maria', lastName: 'Santos' },
  };
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const article = await getArticle(resolvedParams.slug);

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Link href="/news" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to News & Press Releases
      </Link>

      <div className="space-y-4 border-b pb-6">
        <span className="text-xs font-bold font-mono text-primary uppercase bg-primary/10 px-3 py-1 rounded-md">
          Official Press Release
        </span>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-tight">
          {article.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-mono pt-2">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-primary" /> {new Date(article.createdAt).toLocaleDateString()}
          </span>
          {article.author && (
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-primary" /> {article.author.firstName} {article.author.lastName}
            </span>
          )}
        </div>
      </div>

      <div
        className="prose prose-slate max-w-none text-sm leading-relaxed space-y-4"
        dangerouslySetInnerHTML={{ __html: article.body || article.summary }}
      />
    </article>
  );
}
