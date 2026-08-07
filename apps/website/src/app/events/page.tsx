import Link from 'next/link';
import { Calendar, MapPin, ArrowRight, Clock } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const revalidate = 60;

async function getEventsList() {
  try {
    const res = await fetch(`${API_URL}/contents?type=EVENT`, { next: { revalidate: 60 } });
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }
  return [
    {
      id: 'evt-1',
      title: 'National Digital Governance Summit 2026',
      slug: 'national-digital-governance-summit-2026',
      summary: 'Gathering LGU leaders, ICT directors, and cybersecurity experts to align national digital roadmaps.',
      eventDate: new Date(Date.now() + 86400000 * 14).toISOString(),
      location: 'SMX Convention Center, Pasay City',
    },
    {
      id: 'evt-2',
      title: 'Public Consultation on Government Data Privacy Guidelines',
      slug: 'public-consultation-data-privacy-guidelines',
      summary: 'Open stakeholder forum discussing updated data protection compliance protocols.',
      eventDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      location: 'DICT Auditorium, Diliman, Quezon City',
    },
  ];
}

export default async function PublicEventsPage() {
  const events = await getEventsList();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b pb-6 space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
          <Calendar className="h-7 w-7 text-primary" /> Agency Events & Forums
        </h1>
        <p className="text-xs text-muted-foreground">
          Upcoming summits, public consultation forums, regional roadshows, and technical workshops.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((item: any) => (
          <div
            key={item.id}
            className="rounded-2xl border bg-card p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold font-mono text-purple-600 uppercase bg-purple-500/10 px-2.5 py-1 rounded-md">
                  Upcoming Event
                </span>
                <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {new Date(item.eventDate || item.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h2 className="font-bold text-lg text-foreground leading-snug hover:text-primary transition-colors">
                <Link href={`/events/${item.slug}`}>{item.title}</Link>
              </h2>
              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                {item.summary}
              </p>
            </div>

            <div className="pt-3 border-t flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 font-mono text-muted-foreground truncate max-w-xs">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" /> {item.location || 'DICT Main Auditorium'}
              </span>
              <Link href={`/events/${item.slug}`} className="font-bold text-primary hover:underline flex items-center gap-1 shrink-0">
                View Event <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
