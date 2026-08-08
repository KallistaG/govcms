import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin } from 'lucide-react';
import { prisma } from '@govcms/database';

export const dynamic = 'force-dynamic';

async function getEventBySlug(slug: string) {
  try {
    const item = await prisma.contentItem.findFirst({
      where: { slug, type: 'EVENT', status: 'PUBLISHED' },
    });
    if (item) return item;
  } catch {
    // fallback
  }
  if (slug === 'national-e-governance-summit-2026') {
    return {
      title: '2026 National E-Governance Summit & Public Sector Forum',
      body: '<p>Join national government leaders, ICT officials, and policy architects for the 2026 National E-Governance Summit.</p>',
      createdAt: new Date().toISOString(),
    };
  }
  return null;
}

export default async function PublicEventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) notFound();

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Link href="/events" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Events Calendar
      </Link>

      <div className="space-y-4 border-b pb-8">
        <span className="text-[10px] font-bold font-mono text-primary uppercase bg-primary/10 px-2.5 py-1 rounded-md">
          Official Agency Event
        </span>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-tight">
          {event.title}
        </h1>
        <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> Date: {new Date(event.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div
        className="prose prose-slate max-w-none text-sm leading-relaxed text-foreground"
        dangerouslySetInnerHTML={{ __html: event.body || '<p>No details provided.</p>' }}
      />
    </article>
  );
}
