import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getWebsiteSettings, prisma } from '@govcms/database';
import {
  Globe,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getWebsiteSettings();
  return {
    title: settings.seoTitle || `${settings.siteName} | Official Portal`,
    description: settings.seoDescription || settings.tagline || '',
    keywords: settings.keywords || '',
  };
}

function hexToHsl(hex: string): string {
  if (!hex || !hex.startsWith('#')) return '217 91% 32%';
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  if (c.length !== 6) return '217 91% 32%';

  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

async function getPublicTheme() {
  try {
    const theme = await prisma.themeConfig.findFirst({ where: { isActive: true } });
    if (theme) return theme;
  } catch {
    // fallback
  }
  return { primaryColor: '#1d4ed8', secondaryColor: '#7c3aed' };
}

async function getPublicMenu(locationInput: string) {
  const locUpper = String(locationInput || '').toUpperCase();
  let location: any = 'HEADER_MENU';
  if (locUpper.includes('FOOTER')) location = 'FOOTER_MENU';
  if (locUpper.includes('SIDEBAR')) location = 'SIDEBAR_MENU';

  try {
    const menu = await prisma.menu.findFirst({
      where: { location },
      include: { items: { where: { isVisible: true }, orderBy: { order: 'asc' } } },
    });
    if (menu && menu.items) {
      const buildTree = (items: any[], parentId: string | null = null): any[] => {
        return items
          .filter((item) => item.parentId === parentId)
          .sort((a, b) => a.order - b.order)
          .map((item) => ({
            ...item,
            children: buildTree(items, item.id),
          }));
      };
      return { id: menu.id, name: menu.name, location: menu.location, items: buildTree(menu.items, null) };
    }
  } catch {
    // fallback
  }
  return { location, items: [] };
}

async function getPublicWebsiteSettings() {
  let dbSettings: any = null;
  try {
    dbSettings = await getWebsiteSettings();
  } catch {
    // fallback
  }

  try {
    const cookieStore = await cookies();
    const cookieRaw = cookieStore.get('govcms_website_settings')?.value;
    if (cookieRaw) {
      const parsed = JSON.parse(decodeURIComponent(cookieRaw));
      return { ...dbSettings, ...parsed };
    }
  } catch {
    // fallback
  }

  return dbSettings || {
    siteName: '',
    websiteName: '',
    maintenanceMode: false,
  };
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, theme, headerMenu, footerMenu] = await Promise.all([
    getPublicWebsiteSettings(),
    getPublicTheme(),
    getPublicMenu('HEADER'),
    getPublicMenu('FOOTER'),
  ]);

  const primaryHsl = hexToHsl(theme.primaryColor || '#1d4ed8');

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased flex flex-col justify-between selection:bg-primary/20">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          :root {
            --primary: ${primaryHsl};
          }
        `,
        }}
      />

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg font-bold text-xs"
      >
        Skip to main content
      </a>

      {settings.maintenanceMode && (
        <div className="bg-amber-600 text-white px-4 py-3 text-xs font-bold text-center flex flex-col sm:flex-row items-center justify-center gap-2 shadow-md z-50 sticky top-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 animate-bounce" />
            <span className="uppercase tracking-wider">Scheduled System Maintenance Active</span>
          </div>
          <span className="hidden sm:inline">•</span>
          <span className="font-medium text-amber-100">{settings.maintenanceMessage || 'The official agency portal is currently undergoing scheduled system maintenance.'}</span>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            {settings.logo ? (
              <img src={settings.logo} alt={settings.siteName || settings.websiteName || 'Agency Logo'} className="h-10 w-auto object-contain" />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:scale-105 transition-transform">
                <Globe className="h-5 w-5" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-black text-sm text-foreground tracking-tight group-hover:text-primary transition-colors leading-tight">
                {settings.siteName || settings.websiteName || ''}
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold">
                Official Agency Portal
              </span>
            </div>
          </Link>

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

      <main id="main-content">{children}</main>

      <footer className="bg-slate-950 text-slate-300 border-t border-slate-800 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Globe className="h-5 w-5 text-primary" />
                <span>{settings.siteName || settings.websiteName || ''}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {settings.tagline || settings.seoDescription}
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
                {settings.email && <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-primary" /> {settings.email}</li>}
                {settings.phone && <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-primary" /> {settings.phone}</li>}
                {settings.address && <li className="flex items-start gap-2"><MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" /> <span className="font-sans text-[11px]">{settings.address}</span></li>}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Portal Links</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                {settings.facebook && <li><a href={settings.facebook} target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">Official Facebook Page <ExternalLink className="h-3 w-3" /></a></li>}
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <span>© {new Date().getFullYear()} {settings.siteName || settings.websiteName || 'Official Agency Portal'}. All rights reserved.</span>
            <div className="flex items-center gap-4 text-[11px]">
              <Link href="/pages/about" className="hover:text-slate-300 transition-colors">About Mandate</Link>
              <Link href="/admin/login" className="hover:text-slate-300 transition-colors">Admin Portal Login</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
