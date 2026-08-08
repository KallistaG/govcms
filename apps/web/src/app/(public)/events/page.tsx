import Link from 'next/link';
import { Calendar, ArrowRight, MapPin } from 'lucide-react';
import { prisma } from '@govcms/database';

export const dynamic = 'force-dynamic';

async function getEvents() {
  try {
    const items = await prisma.contentItem.findMany({
      where: { type: 'EVENT', status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
    });
    if (items && items.length > 0) return items;
  } catch {
    // fallback
  }
  return [
    {
      id: 'event-1',
      title: '2026 National E-Governance Summit & Public Sector Forum',
      slug: 'national-e-governance-summit-2026',
      summary: 'Annual gathering of government IT executives, regional directors, and digital policymakers.',
      createdAt: new Date().toISOString(),
    },
  ];
}

export default async function PublicEventsPage() {
  const events = await getEvents();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b pb-6 space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
          <Calendar className="h-7 w-7 text-primary" /> Agency Events & Public Summit Calendar
        </h1>
        <p className="text-xs text-muted-foreground">
          Upcoming government conferences, public forums, regional consultations, and live broadcasts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((item: any) => (
          <div key={item.id} className="rounded-2xl border bg-card p-6 shadow-2xs space-y-4">
            <span className="text-[10px] font-bold font-mono text-primary uppercase bg-primary/10 px-2.5 py-1 rounded-md">
              Upcoming Event
            </span>
            <h2 className="font-bold text-base text-foreground leading-snug">
              <Link href={`/events/${item.slug}`} className="hover:text-primary transition-colors">{item.title}</Link>
            </h2>
            <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{item.summary}</p>
            <div className="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground font-mono">
              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              <Link href={`/events/${item.slug}`} className="font-bold text-primary hover:underline flex items-center gap-1">
                View Event <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
