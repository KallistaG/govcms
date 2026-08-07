'use client';

import * as React from 'react';
import {
  useThemeConfig,
  useSaveTheme,
  usePublishTheme,
  ThemeConfig,
} from '../../../../hooks/use-theme';
import {
  Palette,
  Save,
  Send,
  Globe,
  Type,
  PanelTop,
  PanelBottom,
  MousePointer,
  Moon,
  Sun,
  Code,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Input,
  Label,
} from '@govcms/ui';

const FONT_OPTIONS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Outfit',
  'Montserrat', 'Source Sans 3', 'Noto Sans', 'Raleway', 'Merriweather',
  'Playfair Display', 'DM Sans', 'Geist', 'Nunito',
];

const PRESET_COLORS = [
  { name: 'Royal Blue', value: '#1d4ed8' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Crimson', value: '#dc2626' },
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Teal', value: '#0d9488' },
  { name: 'Slate', value: '#334155' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Cyan', value: '#0891b2' },
];

export default function ThemeManagerPage() {
  const { data: initialTheme, isLoading } = useThemeConfig();
  const saveMutation = useSaveTheme();
  const publishMutation = usePublishTheme();

  const [theme, setTheme] = React.useState<ThemeConfig | null>(null);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);

  React.useEffect(() => {
    if (initialTheme && !theme) {
      setTheme(initialTheme);
    }
  }, [initialTheme, theme]);

  const update = (key: keyof ThemeConfig, value: unknown) => {
    if (!theme) return;
    setTheme({ ...theme, [key]: value } as ThemeConfig);
    setHasChanges(true);
  };

  const updateNested = (section: 'navbarStyle' | 'footerStyle' | 'buttonStyle', key: string, value: unknown) => {
    if (!theme) return;
    const current = (theme[section] || {}) as Record<string, unknown>;
    setTheme({ ...theme, [section]: { ...current, [key]: value } } as ThemeConfig);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!theme) return;
    await saveMutation.mutateAsync(theme);
    setHasChanges(false);
    toast.success('Theme draft saved successfully! Live website synced.');
  };

  const handlePublish = async () => {
    if (!theme) return;
    await saveMutation.mutateAsync(theme);
    await publishMutation.mutateAsync();
    setHasChanges(false);
    toast.success('Theme published live to official website!');
  };

  if (isLoading || !theme) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
        Loading theme configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Palette className="h-6 w-6 text-primary" /> Theme Manager
          </h1>
          <p className="text-xs text-muted-foreground">
            Customize branding, colors, typography, navigation, and dark mode. Published changes update the public website instantly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-amber-600 border-amber-500/30 text-[10px] font-bold animate-pulse">
              Unsaved Changes
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)} className="font-semibold gap-1">
            <Eye className="h-3.5 w-3.5" /> {showPreview ? 'Hide' : 'Show'} Preview
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={!hasChanges || saveMutation.isPending} className="font-semibold gap-1">
            <Save className="h-3.5 w-3.5" /> Save Draft
          </Button>
          <Button size="sm" onClick={handlePublish} disabled={publishMutation.isPending} className="font-bold gap-1 shadow-xs">
            <Send className="h-3.5 w-3.5" /> Publish Theme
          </Button>
        </div>
      </div>

      {/* Live Theme Preview Banner */}
      {showPreview && (
        <Card className="shadow-xs border overflow-hidden">
          <div
            className="p-6 flex items-center justify-between"
            style={{ backgroundColor: theme.navbarStyle?.bgColor || '#0f172a' }}
          >
            <div className="flex items-center gap-3">
              {theme.logoUrl ? (
                <div className="h-8 w-8 rounded bg-white/20 flex items-center justify-center overflow-hidden">
                  <span className="text-[10px] font-bold" style={{ color: theme.navbarStyle?.textColor || '#fff' }}>Logo</span>
                </div>
              ) : (
                <Globe className="h-5 w-5" style={{ color: theme.navbarStyle?.textColor || '#fff' }} />
              )}
              <span className="font-bold text-sm" style={{ color: theme.navbarStyle?.textColor || '#fff', fontFamily: theme.fontHeading }}>
                {theme.websiteName}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs" style={{ color: theme.navbarStyle?.textColor || '#fff', fontFamily: theme.fontBody }}>
              <span>Home</span>
              <span>About</span>
              <span>Services</span>
              <span>Contact</span>
            </div>
          </div>
          <div className="p-8 text-center space-y-3" style={{ fontFamily: theme.fontBody }}>
            <h2 className="text-xl font-bold" style={{ fontFamily: theme.fontHeading, color: theme.primaryColor }}>
              Welcome to {theme.websiteName}
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              This is a live preview showing your selected typography, brand colors, and navigation styles.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                className="px-4 py-2 text-xs font-bold text-white"
                style={{
                  backgroundColor: theme.primaryColor,
                  borderRadius: theme.buttonStyle?.borderRadius || '8px',
                  fontWeight: theme.buttonStyle?.fontWeight || '700',
                  textTransform: (theme.buttonStyle?.textTransform || 'none') as React.CSSProperties['textTransform'],
                }}
              >
                Primary Button
              </button>
              <button
                className="px-4 py-2 text-xs font-bold text-white"
                style={{
                  backgroundColor: theme.secondaryColor,
                  borderRadius: theme.buttonStyle?.borderRadius || '8px',
                  fontWeight: theme.buttonStyle?.fontWeight || '700',
                  textTransform: (theme.buttonStyle?.textTransform || 'none') as React.CSSProperties['textTransform'],
                }}
              >
                Secondary Button
              </button>
            </div>
          </div>
          <div
            className="p-4 text-center text-xs"
            style={{
              backgroundColor: theme.footerStyle?.bgColor || '#0f172a',
              color: theme.footerStyle?.textColor || '#94a3b8',
              fontFamily: theme.fontBody,
            }}
          >
            {theme.footerStyle?.copyright || '© 2026 Government Agency. All rights reserved.'}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Branding & Identity ── */}
        <Card className="shadow-xs border bg-card">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> Branding & Identity
            </CardTitle>
            <CardDescription className="text-xs">
              Set your agency&apos;s name, logo, and favicon.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Website Name</Label>
              <Input className="text-xs" value={theme.websiteName} onChange={(e) => update('websiteName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Logo URL</Label>
              <Input className="text-xs" value={theme.logoUrl || ''} onChange={(e) => update('logoUrl', e.target.value)} placeholder="https://agency.gov.ph/logo.svg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Favicon URL</Label>
              <Input className="text-xs" value={theme.faviconUrl || ''} onChange={(e) => update('faviconUrl', e.target.value)} placeholder="https://agency.gov.ph/favicon.ico" />
            </div>
          </CardContent>
        </Card>

        {/* ── Brand Colors ── */}
        <Card className="shadow-xs border bg-card">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" /> Brand Colors
            </CardTitle>
            <CardDescription className="text-xs">
              Primary and secondary brand colors applied throughout the website.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold">Primary Color</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={theme.primaryColor} onChange={(e) => update('primaryColor', e.target.value)} className="h-9 w-14 rounded-lg border cursor-pointer" />
                <Input className="text-xs font-mono flex-1" value={theme.primaryColor} onChange={(e) => update('primaryColor', e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    className={`h-6 w-6 rounded-md border-2 transition-all ${theme.primaryColor === c.value ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => update('primaryColor', c.value)}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold">Secondary Color</Label>
              <div className="flex items-center gap-3">
                <input type="color" value={theme.secondaryColor} onChange={(e) => update('secondaryColor', e.target.value)} className="h-9 w-14 rounded-lg border cursor-pointer" />
                <Input className="text-xs font-mono flex-1" value={theme.secondaryColor} onChange={(e) => update('secondaryColor', e.target.value)} />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    className={`h-6 w-6 rounded-md border-2 transition-all ${theme.secondaryColor === c.value ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => update('secondaryColor', c.value)}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Typography ── */}
        <Card className="shadow-xs border bg-card">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Type className="h-4 w-4 text-primary" /> Typography
            </CardTitle>
            <CardDescription className="text-xs">
              Choose Google Fonts for headings and body text.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Heading Font</Label>
              <select
                className="border rounded-lg px-3 py-2 text-xs w-full bg-background"
                value={theme.fontHeading}
                onChange={(e) => update('fontHeading', e.target.value)}
              >
                {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <p className="text-xl font-bold mt-2" style={{ fontFamily: theme.fontHeading }}>
                Heading Preview: Aa Bb Cc
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Body Font</Label>
              <select
                className="border rounded-lg px-3 py-2 text-xs w-full bg-background"
                value={theme.fontBody}
                onChange={(e) => update('fontBody', e.target.value)}
              >
                {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <p className="text-sm mt-2" style={{ fontFamily: theme.fontBody }}>
                Body text preview: The quick brown fox jumps over the lazy dog.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── Dark Mode ── */}
        <Card className="shadow-xs border bg-card">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              {theme.darkModeEnabled ? <Moon className="h-4 w-4 text-violet-500" /> : <Sun className="h-4 w-4 text-amber-500" />} Dark Mode
            </CardTitle>
            <CardDescription className="text-xs">
              Enable dark mode for the public-facing website portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
              <div>
                <span className="text-sm font-bold text-foreground block">Dark Mode</span>
                <span className="text-[10px] text-muted-foreground">
                  {theme.darkModeEnabled ? 'Dark mode is enabled for the public website.' : 'The website uses light mode styling.'}
                </span>
              </div>
              <button
                className={`relative h-7 w-12 rounded-full transition-colors ${theme.darkModeEnabled ? 'bg-primary' : 'bg-muted'}`}
                onClick={() => update('darkModeEnabled', !theme.darkModeEnabled)}
              >
                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-all ${theme.darkModeEnabled ? 'left-5.5' : 'left-0.5'}`} />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* ── Navbar Style ── */}
        <Card className="shadow-xs border bg-card">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <PanelTop className="h-4 w-4 text-primary" /> Navbar Style
            </CardTitle>
            <CardDescription className="text-xs">
              Configure the top navigation bar appearance.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Background Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={theme.navbarStyle?.bgColor || '#0f172a'} onChange={(e) => updateNested('navbarStyle', 'bgColor', e.target.value)} className="h-8 w-10 rounded border cursor-pointer" />
                  <Input className="text-xs font-mono" value={theme.navbarStyle?.bgColor || '#0f172a'} onChange={(e) => updateNested('navbarStyle', 'bgColor', e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Text Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={theme.navbarStyle?.textColor || '#f8fafc'} onChange={(e) => updateNested('navbarStyle', 'textColor', e.target.value)} className="h-8 w-10 rounded border cursor-pointer" />
                  <Input className="text-xs font-mono" value={theme.navbarStyle?.textColor || '#f8fafc'} onChange={(e) => updateNested('navbarStyle', 'textColor', e.target.value)} />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Position</Label>
              <select className="border rounded-lg px-3 py-2 text-xs w-full bg-background" value={theme.navbarStyle?.position || 'sticky'} onChange={(e) => updateNested('navbarStyle', 'position', e.target.value)}>
                <option value="sticky">Sticky (Follows Scroll)</option>
                <option value="fixed">Fixed (Always Visible)</option>
                <option value="static">Static (Scrolls Away)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* ── Footer Style ── */}
        <Card className="shadow-xs border bg-card">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <PanelBottom className="h-4 w-4 text-primary" /> Footer Style
            </CardTitle>
            <CardDescription className="text-xs">
              Configure the bottom footer section appearance.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Background Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={theme.footerStyle?.bgColor || '#0f172a'} onChange={(e) => updateNested('footerStyle', 'bgColor', e.target.value)} className="h-8 w-10 rounded border cursor-pointer" />
                  <Input className="text-xs font-mono" value={theme.footerStyle?.bgColor || '#0f172a'} onChange={(e) => updateNested('footerStyle', 'bgColor', e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Text Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={theme.footerStyle?.textColor || '#94a3b8'} onChange={(e) => updateNested('footerStyle', 'textColor', e.target.value)} className="h-8 w-10 rounded border cursor-pointer" />
                  <Input className="text-xs font-mono" value={theme.footerStyle?.textColor || '#94a3b8'} onChange={(e) => updateNested('footerStyle', 'textColor', e.target.value)} />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Copyright Text</Label>
              <Input className="text-xs" value={theme.footerStyle?.copyright || ''} onChange={(e) => updateNested('footerStyle', 'copyright', e.target.value)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-bold">Show Social Media Icons</Label>
                <p className="text-[10px] text-muted-foreground">Display social media links in footer</p>
              </div>
              <input type="checkbox" className="h-4 w-4 rounded accent-primary" checked={theme.footerStyle?.showSocials ?? true} onChange={(e) => updateNested('footerStyle', 'showSocials', e.target.checked)} />
            </div>
          </CardContent>
        </Card>

        {/* ── Button Style ── */}
        <Card className="shadow-xs border bg-card">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <MousePointer className="h-4 w-4 text-primary" /> Button Style
            </CardTitle>
            <CardDescription className="text-xs">
              Global button appearance across the website.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Border Radius</Label>
              <select className="border rounded-lg px-3 py-2 text-xs w-full bg-background" value={theme.buttonStyle?.borderRadius || '8px'} onChange={(e) => updateNested('buttonStyle', 'borderRadius', e.target.value)}>
                <option value="0px">Square (0px)</option>
                <option value="4px">Slight (4px)</option>
                <option value="8px">Rounded (8px)</option>
                <option value="12px">More Rounded (12px)</option>
                <option value="9999px">Pill (Full)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Font Weight</Label>
              <select className="border rounded-lg px-3 py-2 text-xs w-full bg-background" value={theme.buttonStyle?.fontWeight || '700'} onChange={(e) => updateNested('buttonStyle', 'fontWeight', e.target.value)}>
                <option value="400">Normal (400)</option>
                <option value="500">Medium (500)</option>
                <option value="600">Semibold (600)</option>
                <option value="700">Bold (700)</option>
                <option value="800">Extra Bold (800)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Text Transform</Label>
              <select className="border rounded-lg px-3 py-2 text-xs w-full bg-background" value={theme.buttonStyle?.textTransform || 'none'} onChange={(e) => updateNested('buttonStyle', 'textTransform', e.target.value)}>
                <option value="none">None</option>
                <option value="uppercase">UPPERCASE</option>
                <option value="capitalize">Capitalize</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-2 border-t">
              <button
                className="px-4 py-2 text-xs text-white transition-all"
                style={{
                  backgroundColor: theme.primaryColor,
                  borderRadius: theme.buttonStyle?.borderRadius || '8px',
                  fontWeight: theme.buttonStyle?.fontWeight || '700',
                  textTransform: (theme.buttonStyle?.textTransform || 'none') as React.CSSProperties['textTransform'],
                }}
              >
                Primary Preview
              </button>
              <button
                className="px-4 py-2 text-xs text-white transition-all"
                style={{
                  backgroundColor: theme.secondaryColor,
                  borderRadius: theme.buttonStyle?.borderRadius || '8px',
                  fontWeight: theme.buttonStyle?.fontWeight || '700',
                  textTransform: (theme.buttonStyle?.textTransform || 'none') as React.CSSProperties['textTransform'],
                }}
              >
                Secondary Preview
              </button>
            </div>
          </CardContent>
        </Card>

        {/* ── Custom CSS ── */}
        <Card className="shadow-xs border bg-card">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Code className="h-4 w-4 text-primary" /> Custom CSS Override
            </CardTitle>
            <CardDescription className="text-xs">
              Advanced: inject custom CSS rules into the public website.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <textarea
              className="border rounded-lg px-3 py-2 text-xs w-full bg-background font-mono min-h-[120px] resize-y"
              value={theme.customCss || ''}
              onChange={(e) => update('customCss', e.target.value)}
              placeholder={`/* Custom CSS overrides */\n.hero-section {\n  background: linear-gradient(135deg, #1d4ed8, #7c3aed);\n}`}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
