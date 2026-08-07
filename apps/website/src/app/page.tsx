import Link from 'next/link';
import {
  Sparkles,
  Newspaper,
  Download,
  Building2,
  ArrowRight,
  MapPin,
  FileText,
  ShieldCheck,
  Award,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const revalidate = 60;

async function getPublicHomepage() {
  try {
    const res = await fetch(`${API_URL}/page-builder/homepage/public`, { next: { revalidate: 60 } });
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }
  return null;
}

async function getLatestNews() {
  try {
    const res = await fetch(`${API_URL}/contents?type=PRESS_RELEASE&limit=3`, { next: { revalidate: 60 } });
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
    },
    {
      id: 'news-2',
      title: 'National Cybersecurity System Upgraded to Protect Critical Public Information',
      slug: 'national-cybersecurity-system-upgraded',
      summary: 'Enhanced threat detection tools deployed nationwide to safeguard public databases.',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ];
}

export default async function PublicHomePage() {
  const [homepage, newsItems] = await Promise.all([
    getPublicHomepage(),
    getLatestNews(),
  ]);

  const sections = homepage?.sections || [];

  return (
    <div className="space-y-16 pb-16">
      {sections.length > 0 ? (
        sections.map((sec: any) => {
          if (sec.type === 'hero') {
            return (
              <section key={sec.id} className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-primary/95 to-slate-950 text-white py-24 px-4 sm:px-6 lg:px-8 border-b border-primary/20">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
                  <div className="space-y-6 text-center lg:text-left max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold border border-white/20 backdrop-blur-xs">
                      <Sparkles className="h-3.5 w-3.5" /> Republic of the Philippines Official Portal
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
                      {sec.config?.headline || sec.title || 'Department of Information and Communications Technology'}
                    </h1>
                    <p className="text-base text-slate-200 leading-relaxed font-normal">
                      {sec.config?.subtext || 'Empowering Filipinos through innovative ICT solutions and accessible public digital services.'}
                    </p>
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                      <Link href={sec.config?.ctaUrl || '/news'} className="px-6 py-3 rounded-xl bg-white text-slate-950 font-black text-xs hover:bg-slate-100 transition-all shadow-lg flex items-center gap-2">
                        {sec.config?.ctaLabel || 'Read Announcements'} <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link href="/downloads" className="px-6 py-3 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-all border border-white/20 flex items-center gap-2">
                        FOI Downloads <Download className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 w-full lg:w-auto shrink-0">
                    <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 space-y-1 text-center">
                      <span className="text-3xl font-black text-amber-400 font-mono">100M+</span>
                      <span className="text-xs font-semibold text-slate-200 block">Citizens Served</span>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 space-y-1 text-center">
                      <span className="text-3xl font-black text-amber-400 font-mono">99.9%</span>
                      <span className="text-xs font-semibold text-slate-200 block">Portal Uptime</span>
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          if (sec.type === 'news') {
            return (
              <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                      <Newspaper className="h-6 w-6 text-primary" /> {sec.title || 'Latest Press Releases & News'}
                    </h2>
                    <p className="text-xs text-muted-foreground">Official agency announcements, executive orders, and national advisories.</p>
                  </div>
                  <Link href="/news" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                    View All News <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {newsItems.map((item: any) => (
                    <div key={item.id} className="rounded-2xl border bg-card p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold font-mono text-primary uppercase bg-primary/10 px-2.5 py-1 rounded-md">Press Release</span>
                        <h3 className="font-bold text-base text-foreground leading-snug hover:text-primary transition-colors">
                          <Link href={`/news/${item.slug}`}>{item.title}</Link>
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                          {item.summary || 'Read full official press statement published by the agency.'}
                        </p>
                      </div>
                      <div className="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground font-mono">
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        <Link href={`/news/${item.slug}`} className="font-bold text-primary hover:underline">Read Article →</Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          if (sec.type === 'cards') {
            return (
              <section key={sec.id} className="bg-muted/30 py-16 border-y">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                  <div className="text-center space-y-2 max-w-xl mx-auto">
                    <h2 className="text-2xl font-black tracking-tight text-foreground">{sec.title || 'Official Digital Public Services'}</h2>
                    <p className="text-xs text-muted-foreground">Access digital government tools, permit applications, and public information portals.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="p-6 rounded-2xl border bg-card shadow-2xs space-y-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><FileText className="h-5 w-5" /></div>
                      <h3 className="font-bold text-sm text-foreground">Freedom of Information (FOI)</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">Request official government records and agency statistics through the public FOI portal.</p>
                    </div>
                    <div className="p-6 rounded-2xl border bg-card shadow-2xs space-y-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><ShieldCheck className="h-5 w-5" /></div>
                      <h3 className="font-bold text-sm text-foreground">Cybersecurity Advisories</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">Stay informed with national threat alerts, CERT advisories, and data privacy guidelines.</p>
                    </div>
                    <div className="p-6 rounded-2xl border bg-card shadow-2xs space-y-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Building2 className="h-5 w-5" /></div>
                      <h3 className="font-bold text-sm text-foreground">Regional Office Directory</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">Locate provincial ICT hubs, regional directors, and local public assistance desks.</p>
                    </div>
                    <div className="p-6 rounded-2xl border bg-card shadow-2xs space-y-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Award className="h-5 w-5" /></div>
                      <h3 className="font-bold text-sm text-foreground">Public Bids & Awards</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">View invitation to bid notices, PhilGEPS opportunities, and procurement contracts.</p>
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          if (sec.type === 'map' || sec.type === 'contact') {
            return (
              <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="border-b pb-4">
                  <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                    <MapPin className="h-6 w-6 text-primary" /> {sec.title || 'Central Office Location & Contact Desk'}
                  </h2>
                  <p className="text-xs text-muted-foreground">Visit our central office or submit inquiries to our public assistance team.</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className="rounded-2xl border bg-card p-6 shadow-2xs space-y-4">
                    <h3 className="font-bold text-base text-foreground">Department Head Office</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">DICT Building, C.P. Garcia Ave., Diliman, Quezon City, 1101 Philippines</p>
                    <div className="space-y-2 text-xs font-mono">
                      <p><span className="font-bold text-foreground">Trunkline:</span> +63 (02) 8920-0101</p>
                      <p><span className="font-bold text-foreground">Public Email:</span> info@dict.gov.ph</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border bg-muted/40 h-64 overflow-hidden shadow-2xs">
                    <iframe title="Agency Office Map" src="https://maps.google.com/maps?q=DICT+Quezon+City&t=&z=15&ie=UTF8&iwloc=&output=embed" className="w-full h-full border-0" loading="lazy" />
                  </div>
                </div>
              </section>
            );
          }

          return null;
        })
      ) : (
        /* Default Fallback Sections */
        <>
          <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-primary/95 to-slate-950 text-white py-24 px-4 sm:px-6 lg:px-8 border-b border-primary/20">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="space-y-6 text-center lg:text-left max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold border border-white/20 backdrop-blur-xs">
                  <Sparkles className="h-3.5 w-3.5" /> Republic of the Philippines Official Portal
                </div>
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
                  Empowering Every Filipino Through Digital Innovation & Connectivity
                </h1>
                <p className="text-base text-slate-200 leading-relaxed font-normal">
                  Access official press releases, government digital services, executive orders, cybersecurity advisories, and public notices.
                </p>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                  <Link href="/news" className="px-6 py-3 rounded-xl bg-white text-slate-950 font-black text-xs hover:bg-slate-100 transition-all shadow-lg flex items-center gap-2">
                    Read Press Releases <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/downloads" className="px-6 py-3 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/20 transition-all border border-white/20 flex items-center gap-2">
                    FOI Downloads <Download className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full lg:w-auto shrink-0">
                <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 space-y-1 text-center">
                  <span className="text-3xl font-black text-amber-400 font-mono">100M+</span>
                  <span className="text-xs font-semibold text-slate-200 block">Citizens Served</span>
                </div>
                <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 space-y-1 text-center">
                  <span className="text-3xl font-black text-amber-400 font-mono">99.9%</span>
                  <span className="text-xs font-semibold text-slate-200 block">Portal Uptime</span>
                </div>
              </div>
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                  <Newspaper className="h-6 w-6 text-primary" /> Latest Press Releases & News
                </h2>
                <p className="text-xs text-muted-foreground">Official agency announcements, executive orders, and national advisories.</p>
              </div>
              <Link href="/news" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                View All News <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {newsItems.map((item: any) => (
                <div key={item.id} className="rounded-2xl border bg-card p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold font-mono text-primary uppercase bg-primary/10 px-2.5 py-1 rounded-md">Press Release</span>
                    <h3 className="font-bold text-base text-foreground leading-snug hover:text-primary transition-colors">
                      <Link href={`/news/${item.slug}`}>{item.title}</Link>
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {item.summary || 'Read full official press statement published by the agency.'}
                    </p>
                  </div>
                  <div className="pt-3 border-t flex items-center justify-between text-xs text-muted-foreground font-mono">
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    <Link href={`/news/${item.slug}`} className="font-bold text-primary hover:underline">Read Article →</Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
