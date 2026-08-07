import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import {
  Globe,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const revalidate = 60; // ISR revalidation every 60 seconds

export const metadata: Metadata = {
  title: 'Department of Information and Communications Technology | Official Portal',
  description:
    'Official government portal for public services, press releases, executive orders, public notices, and ICT projects.',
  keywords: 'govcms, philippines, dict, government, public services, press release',
};

async function getSiteConfig() {
  try {
    const res = await fetch(`${API_URL}/site-settings/public`, { next: { revalidate: 60 } });
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }
  return {
    websiteName: 'Department of Information and Communications Technology',
    description: 'Official government portal for public services, press releases, and agency updates.',
    email: 'info@dict.gov.ph',
    phone: '+63 (02) 8920-0101',
    address: 'DICT Building, C.P. Garcia Ave., Diliman, Quezon City, 1101 Philippines',
    socialLinks: { facebook: 'https://facebook.com/DICTgovph', twitter: 'https://twitter.com/DICTgovph' },
    analyticsId: 'G-GOVCMS2026',
    maintenanceMode: false,
    maintenanceMessage: 'The official agency portal is currently undergoing scheduled system maintenance.',
  };
}

async function getPublicTheme() {
  try {
    const res = await fetch(`${API_URL}/theme/public`, { next: { revalidate: 60 } });
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }
  return {
    websiteName: 'Department of Information and Communications Technology',
    primaryColor: '#1d4ed8',
    secondaryColor: '#7c3aed',
  };
}

async function getPublicMenu(location: string) {
  try {
    const res = await fetch(`${API_URL}/menus/public/${location}`, { next: { revalidate: 60 } });
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }
  return { items: [] };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, theme, headerMenu, footerMenu] = await Promise.all([
    getSiteConfig(),
    getPublicTheme(),
    getPublicMenu('HEADER'),
    getPublicMenu('FOOTER'),
  ]);

  const primaryHex = theme.primaryColor || '#1d4ed8';

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            :root {
              --primary: ${primaryHex};
            }
          `
        }} />
        {settings.analyticsId && (
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${settings.analyticsId}`}
          />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'GovernmentOrganization',
              name: settings.websiteName || 'Department of Information and Communications Technology',
              url: 'https://dict.gov.ph',
              description: settings.description,
              email: settings.email,
              telephone: settings.phone,
              address: {
                '@type': 'PostalAddress',
                streetAddress: settings.address,
                addressCountry: 'PH',
              },
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased flex flex-col justify-between selection:bg-primary/20">
        {/* WCAG 2.2 Screen Reader Skip Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg font-bold text-xs"
        >
          Skip to main content
        </a>

        {/* Maintenance Mode Banner */}
        {settings.maintenanceMode && (
          <div className="bg-amber-600 text-white px-4 py-2.5 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-md">
            <AlertTriangle className="h-4 w-4 shrink-0 animate-bounce" />
            <span>{settings.maintenanceMessage || 'System Maintenance in progress.'}</span>
          </div>
        )}

        {/* Top Republic Bar */}
        <div className="bg-slate-950 text-slate-300 text-[11px] py-1.5 px-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <span className="font-bold text-amber-400 uppercase tracking-wider">Republic of the Philippines</span>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="hidden sm:inline">Official Government Agency Portal</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono">
            <span>PST: {new Date().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Main Agency Header Navbar */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:scale-105 transition-transform">
                <Globe className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm text-foreground tracking-tight group-hover:text-primary transition-colors leading-tight">
                  {settings.websiteName || theme.websiteName || 'GovCMS Agency Portal'}
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  GOV.PH Official Web Platform
                </span>
              </div>
            </Link>

            {/* Dynamic Navigation Menu Items (with Submenus) */}
            <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
              <Link href="/" className="px-3 py-2 rounded-lg text-foreground hover:bg-accent hover:text-primary transition-colors">
                Home
              </Link>
              <Link href="/news" className="px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-primary transition-colors">
                News & Press
              </Link>
              <Link href="/events" className="px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-primary transition-colors">
                Events
              </Link>
              <Link href="/downloads" className="px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-primary transition-colors">
                FOI Downloads
              </Link>

              {headerMenu.items &&
                headerMenu.items.map((item: any) => {
                  const hasChildren = item.children && item.children.length > 0;
                  return (
                    <div key={item.id} className="relative group/menu">
                      <Link
                        href={item.url || '#'}
                        target={item.openInNewTab ? '_blank' : '_self'}
                        className="px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-primary transition-colors flex items-center gap-1"
                      >
                        {item.title}
                        {hasChildren && <ChevronDown className="h-3 w-3 opacity-60" />}
                        {item.isExternal && <ExternalLink className="h-3 w-3 opacity-60" />}
                      </Link>

                      {hasChildren && (
                        <div className="absolute left-0 top-full hidden group-hover/menu:block min-w-48 bg-card border rounded-xl shadow-xl py-2 z-50 animate-in fade-in-50 slide-in-from-top-1">
                          {item.children.map((child: any) => (
                            <Link
                              key={child.id}
                              href={child.url || '#'}
                              target={child.openInNewTab ? '_blank' : '_self'}
                              className="block px-4 py-2 text-xs font-medium text-foreground hover:bg-accent hover:text-primary transition-colors"
                            >
                              {child.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </nav>
          </div>
        </header>

        {/* Main Content Area */}
        <main id="main-content">{children}</main>

        {/* Footer */}
        <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 pt-12 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Globe className="h-5 w-5 text-primary" />
                  <span>{settings.websiteName}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {settings.description}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Navigation Links</h4>
                <ul className="space-y-2 text-xs text-slate-400">
                  <li><Link href="/" className="hover:text-white transition-colors">Home Portal</Link></li>
                  <li><Link href="/news" className="hover:text-white transition-colors">Press Releases & News</Link></li>
                  <li><Link href="/events" className="hover:text-white transition-colors">Agency Events Calendar</Link></li>
                  <li><Link href="/downloads" className="hover:text-white transition-colors">Freedom of Information (FOI)</Link></li>
                  {footerMenu.items &&
                    footerMenu.items.map((item: any) => (
                      <li key={item.id}>
                        <Link href={item.url || '#'} className="hover:text-white transition-colors">
                          {item.title}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Agency Contact</h4>
                <ul className="space-y-2 text-xs text-slate-400 font-mono">
                  <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-primary" /> {settings.email}</li>
                  <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-primary" /> {settings.phone}</li>
                  <li className="flex items-start gap-2"><MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" /> <span className="font-sans text-[11px]">{settings.address}</span></li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">GOV.PH Links</h4>
                <ul className="space-y-2 text-xs text-slate-400">
                  <li><a href="https://www.gov.ph" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">Official Gazette <ExternalLink className="h-3 w-3" /></a></li>
                  <li><a href="https://dict.gov.ph" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">DICT Central Portal <ExternalLink className="h-3 w-3" /></a></li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
              <span>© {new Date().getFullYear()} Republic of the Philippines. All rights reserved.</span>
              <div className="flex items-center gap-4 text-[11px]">
                <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms of Use</Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
