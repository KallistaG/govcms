'use client';

import * as React from 'react';
import {
  useSiteSettings,
  useUpdateSiteSettings,
  SiteSettingsData,
} from '../../../../../hooks/use-site-settings';
import {
  Globe,
  Save,
  Mail,
  Share2,
  AlertOctagon,
  Building2,
  Phone,
  MapPin,
  Eye,
  X,
  AlertTriangle,
  Monitor,
  CheckCircle2,
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

export default function GeneralSettingsPage() {
  const { data: initialSettings, isLoading } = useSiteSettings();
  const updateMutation = useUpdateSiteSettings();

  const [settings, setSettings] = React.useState<SiteSettingsData | null>(null);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);

  React.useEffect(() => {
    if (initialSettings && !settings) {
      setSettings(initialSettings);
    }
  }, [initialSettings, settings]);

  const update = (key: keyof SiteSettingsData, value: unknown) => {
    if (!settings) return;
    const next: any = { ...settings, [key]: value };
    if (key === 'siteName') next.websiteName = value;
    if (key === 'websiteName') next.siteName = value;
    if (key === 'tagline') next.description = value;
    if (key === 'description') next.tagline = value;
    setSettings(next as SiteSettingsData);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      await updateMutation.mutateAsync(settings);
      setHasChanges(false);
      toast.success('Website Settings updated successfully!');
    } catch {
      toast.error('Failed to update settings');
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">
        Loading site settings from PostgreSQL...
      </div>
    );
  }

  const siteName = settings.siteName || settings.websiteName || '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" /> Agency Portal & Website Settings
          </h1>
          <p className="text-xs text-muted-foreground">
            Directly configure official agency branding, contact information, SEO metadata, and maintenance mode in PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(true)} className="font-bold text-xs gap-1">
            <Eye className="h-4 w-4 text-primary" /> Live Website Preview
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges} className="font-bold text-xs gap-1 shadow-xs">
            <Save className="h-4 w-4" /> Save Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Identity & Branding */}
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" /> Agency Identity & Site Name
              </CardTitle>
              <CardDescription className="text-xs">
                Official name and tagline displayed on public layout headers, metadata, and footer branding.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName" className="font-bold text-xs">
                  Official Site / Agency Name
                </Label>
                <Input
                  id="siteName"
                  value={settings.siteName || settings.websiteName || ''}
                  onChange={(e) => update('siteName', e.target.value)}
                  placeholder="e.g. Department of Agriculture"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline" className="font-bold text-xs">
                  Agency Tagline / Mission Statement
                </Label>
                <Input
                  id="tagline"
                  value={settings.tagline || settings.description || ''}
                  onChange={(e) => update('tagline', e.target.value)}
                  placeholder="e.g. Providing safe, adequate, safe and potable water supply affordable to all."
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Details */}
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" /> Official Contact Information
              </CardTitle>
              <CardDescription className="text-xs">
                Public helpline, official email, physical address, and map location desk.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-bold text-xs flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Official Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email || ''}
                    onChange={(e) => update('email', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-bold text-xs flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Official Hotline / Telephone
                  </Label>
                  <Input
                    id="phone"
                    value={settings.phone || ''}
                    onChange={(e) => update('phone', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="font-bold text-xs flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Physical Office Address
                </Label>
                <Input
                  id="address"
                  value={settings.address || ''}
                  onChange={(e) => update('address', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Mode */}
          <Card className={settings.maintenanceMode ? 'border-2 border-amber-500 bg-amber-50/20' : ''}>
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-600">
                  <AlertOctagon className="h-5 w-5" /> Portal Maintenance Mode
                </CardTitle>
                <Badge variant={settings.maintenanceMode ? 'destructive' : 'outline'} className="font-mono text-[10px]">
                  {settings.maintenanceMode ? 'MAINTENANCE ACTIVE' : 'LIVE ONLINE'}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Toggle maintenance mode to display warning banners across all public portal pages.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center justify-between border p-4 rounded-xl bg-card">
                <div className="space-y-0.5">
                  <span className="font-bold text-sm text-foreground">Activate Portal Maintenance Mode</span>
                  <p className="text-xs text-muted-foreground">
                    Display notice banner on public layout header and restrict non-admin access.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode || false}
                  onChange={(e) => update('maintenanceMode', e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </div>

              {settings.maintenanceMode && (
                <div className="space-y-2 animate-in fade-in-50">
                  <Label htmlFor="maintenanceMessage" className="font-bold text-xs text-amber-800">
                    Custom Maintenance Banner Message
                  </Label>
                  <Input
                    id="maintenanceMessage"
                    value={settings.maintenanceMessage || ''}
                    onChange={(e) => update('maintenanceMessage', e.target.value)}
                    placeholder="e.g. The official agency portal is currently undergoing scheduled maintenance."
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status Side Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Settings Sync Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-50 border-emerald-200">
                  Configured
                </Badge>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Unsaved Edits</span>
                <span className={`font-bold font-mono ${hasChanges ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {hasChanges ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="pt-2 space-y-2">
                <Button variant="outline" className="w-full font-bold text-xs gap-1" onClick={() => setIsPreviewOpen(true)}>
                  <Eye className="h-4 w-4 text-primary" /> Preview Live Layout
                </Button>
                <Button className="w-full font-bold text-xs" onClick={handleSave} disabled={!hasChanges}>
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Live Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-between animate-in fade-in-50">
          <div className="bg-slate-900 border-b border-slate-800 text-white px-6 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-primary" />
              <span className="font-bold text-sm">Live Website Settings Preview</span>
            </div>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800" onClick={() => setIsPreviewOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-950/60">
            <div className="w-full max-w-5xl bg-background text-foreground shadow-2xl rounded-2xl border flex flex-col min-h-[600px]">
              {/* Maintenance Banner */}
              {settings.maintenanceMode && (
                <div className="bg-amber-600 text-white px-4 py-3 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-md">
                  <AlertTriangle className="h-4 w-4 animate-bounce shrink-0" />
                  <span>{settings.maintenanceMessage || 'System Maintenance in progress.'}</span>
                </div>
              )}

              {/* PST Bar */}
              <div className="bg-slate-950 text-slate-300 text-[11px] py-1.5 px-4 border-b border-slate-800 flex items-center justify-between">
                <span className="font-bold text-amber-400 uppercase tracking-wider">Republic of the Philippines</span>
                <span className="font-mono text-[10px]">PST Official</span>
              </div>

              {/* Header */}
              <header className="border-b bg-card px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-black text-base text-foreground tracking-tight">{siteName}</h2>
                    <p className="text-[11px] text-muted-foreground font-semibold">GOV.PH Official Web Platform</p>
                  </div>
                </div>
                <nav className="hidden sm:flex items-center gap-4 text-xs font-bold text-muted-foreground">
                  <span className="text-primary">Home</span>
                  <span>News</span>
                  <span>FOI Downloads</span>
                  <span>Services</span>
                </nav>
              </header>

              {/* Main Content Preview */}
              <div className="p-8 space-y-6 flex-1 max-w-3xl mx-auto text-center flex flex-col items-center justify-center">
                <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 px-3 py-1">
                  Official Public Portal Preview
                </Badge>

                <h1 className="text-3xl font-black text-foreground tracking-tight">{siteName}</h1>
                <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                  {settings.tagline || 'Providing safe, adequate, safe and potable water supply affordable to all.'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full pt-6 text-left">
                  <div className="border p-4 rounded-xl bg-card space-y-1">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="font-bold text-xs block text-foreground">Official Email</span>
                    <p className="text-[11px] text-muted-foreground font-mono">{settings.email || 'No email configured'}</p>
                  </div>

                  <div className="border p-4 rounded-xl bg-card space-y-1">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="font-bold text-xs block text-foreground">Official Hotline</span>
                    <p className="text-[11px] text-muted-foreground font-mono">{settings.phone || 'No phone configured'}</p>
                  </div>

                  <div className="border p-4 rounded-xl bg-card space-y-1">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="font-bold text-xs block text-foreground">Office Address</span>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{settings.address || 'No address configured yet'}</p>
                  </div>
                </div>
              </div>

              {/* Footer Preview */}
              <footer className="bg-slate-950 text-slate-400 p-6 border-t border-slate-800 text-xs flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Globe className="h-4 w-4 text-primary" /> {siteName}
                </div>
                <p className="text-[11px] text-slate-500">
                  © 2026 Republic of the Philippines. All rights reserved.
                </p>
              </footer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
