import Link from 'next/link';
import { Calendar, MapPin, ArrowLeft } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const revalidate = 60;

async function getEvent(slug: string) {
  try {
    const res = await fetch(`${API_URL}/contents/slug/${slug}`, { next: { revalidate: 60 } });
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }
  return {
    title: 'National Digital Governance Summit 2026',
    summary: 'Gathering LGU leaders, ICT directors, and cybersecurity experts to align national digital roadmaps.',
    body: `
      <p>Join key decision-makers, municipal mayors, regional ICT officers, and cybersecurity industry pioneers for the flagship National Digital Governance Summit 2026.</p>
      <h3>Agenda Highlights</h3>
      <ul>
        <li>Keynote: Unified Citizen Digital Identity Framework (eGov PH)</li>
        <li>Panel: Securing Critical Information Infrastructure (CII)</li>
        <li>Workshop: Fast-tracking Municipal Online Permitting Systems</li>
      </ul>
      <p>Registration is open for official government delegates. Confirmation codes will be dispatched via registered agency email.</p>
    `,
    eventDate: new Date(Date.now() + 86400000 * 14).toISOString(),
    location: 'SMX Convention Center, Pasay City',
  };
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const event = await getEvent(resolvedParams.slug);

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <Link href="/events" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Events Calendar
      </Link>

      <div className="space-y-4 border-b pb-6">
        <span className="text-xs font-bold font-mono text-purple-600 uppercase bg-purple-500/10 px-3 py-1 rounded-md">
          Official Agency Event
        </span>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-tight">
          {event.title}
        </h1>

        <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground font-mono pt-2">
          <span className="flex items-center gap-1.5 font-bold text-foreground">
            <Calendar className="h-4 w-4 text-primary" /> {new Date(event.eventDate).toLocaleDateString()}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-primary" /> {event.location || 'SMX Convention Center'}
          </span>
        </div>
      </div>

      <div
        className="prose prose-slate max-w-none text-sm leading-relaxed space-y-4"
        dangerouslySetInnerHTML={{ __html: event.body || event.summary }}
      />
    </article>
  );
}
