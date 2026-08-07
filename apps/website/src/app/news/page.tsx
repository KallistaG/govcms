import Link from 'next/link';
import { Newspaper, ArrowRight } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const revalidate = 60;

async function getNewsList() {
  try {
    const res = await fetch(`${API_URL}/contents?type=PRESS_RELEASE`, { next: { revalidate: 60 } });
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }
  return [
    {
      id: 'news-1',
      title: 'DICT Launches Enterprise Cloud Infrastructure for Regional Government Units',
      slug: 'dict-launches-enterprise-cloud-infrastructure',
      summary: 'Accelerating digital transformation across local government units with secure cloud hosting services.',
      createdAt: new Date().toISOString(),
      author: { firstName: 'Maria', lastName: 'Santos' },
    },
    {
      id: 'news-2',
      title: 'National Cybersecurity System Upgraded to Protect Critical Public Information',
      slug: 'national-cybersecurity-system-upgraded',
      summary: 'Enhanced threat detection tools deployed nationwide to safeguard public databases.',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      author: { firstName: 'Juan', lastName: 'Dela Cruz' },
    },
  ];
}

export default async function PublicNewsPage() {
  const newsList = await getNewsList();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b pb-6 space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
          <Newspaper className="h-7 w-7 text-primary" /> Press Releases & Official News
        </h1>
        <p className="text-xs text-muted-foreground">
          Official news releases, executive advisories, and policy announcements published by the agency.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {newsList.map((item: any) => (
          <div
            key={item.id}
            className="rounded-2xl border bg-card p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <span className="text-[10px] font-bold font-mono text-primary uppercase bg-primary/10 px-2.5 py-1 rounded-md">
                Press Release
              </span>
              <h2 className="font-bold text-base text-foreground leading-snug hover:text-primary transition-colors">
                <Link href={`/news/${item.slug}`}>{item.title}</Link>
              </h2>
              <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                {item.summary || 'Read full official press statement published by the agency.'}
              </p>
            </div>

            <div className="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground font-mono">
              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              <Link href={`/news/${item.slug}`} className="font-bold text-primary hover:underline flex items-center gap-1">
                Read Article <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
