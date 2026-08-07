'use client';

import * as React from 'react';
import {
  useSiteSettings,
  useUpdateSiteSettings,
  SiteSettingsData,
} from '../../../../hooks/use-site-settings';
import {
  Globe,
  Save,
  Mail,
  Share2,
  Send,
  AlertOctagon,
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

  React.useEffect(() => {
    if (initialSettings && !settings) {
      setSettings(initialSettings);
    }
  }, [initialSettings, settings]);

  const update = (key: keyof SiteSettingsData, value: unknown) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value } as SiteSettingsData);
    setHasChanges(true);
  };

  const updateSocial = (network: string, url: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      socialLinks: { ...settings.socialLinks, [network]: url },
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!settings) return;
    await updateMutation.mutateAsync(settings);
    setHasChanges(false);
    toast.success('Website Settings updated successfully! Live website synced.');
  };

  if (isLoading || !settings) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-muted-foreground">
        Loading website settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" /> General Website Settings
          </h1>
          <p className="text-xs text-muted-foreground">
            Configure website name, SEO meta tags, contact information, social links, SMTP server, and maintenance mode.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-amber-600 border-amber-500/30 text-[10px] font-bold animate-pulse">
              Unsaved Changes
            </Badge>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
            className="font-bold gap-1 shadow-xs"
          >
            <Save className="h-3.5 w-3.5" /> Save Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── General Info & SEO ── */}
        <Card className="shadow-xs border bg-card">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> Website Identity & SEO
            </CardTitle>
            <CardDescription className="text-xs">
              Official agency name, search engine meta descriptions, and keywords.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Official Website Name</Label>
              <Input
                className="text-xs"
                value={settings.websiteName}
                onChange={(e) => update('websiteName', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">SEO Meta Description</Label>
              <textarea
                className="border rounded-lg px-3 py-2 text-xs w-full bg-background min-h-[70px] resize-y"
                value={settings.description}
                onChange={(e) => update('description', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">SEO Search Keywords</Label>
              <Input
                className="text-xs font-mono"
                value={settings.keywords}
                onChange={(e) => update('keywords', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Maintenance Mode Toggle ── */}
        <Card className="shadow-xs border bg-card">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertOctagon className="h-4 w-4" /> System Maintenance Mode
            </CardTitle>
            <CardDescription className="text-xs">
              Temporarily restrict public access while administrators perform updates.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
              <div>
                <span className="text-sm font-bold text-foreground block">Maintenance Mode</span>
                <span className="text-[10px] text-muted-foreground">
                  {settings.maintenanceMode
                    ? 'Public site is offline showing maintenance banner.'
                    : 'Public site is live and operational.'}
                </span>
              </div>
              <button
                className={`relative h-7 w-12 rounded-full transition-colors ${
                  settings.maintenanceMode ? 'bg-destructive' : 'bg-muted'
                }`}
                onClick={() => update('maintenanceMode', !settings.maintenanceMode)}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-all ${
                    settings.maintenanceMode ? 'left-5.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Maintenance Notice Message</Label>
              <textarea
                className="border rounded-lg px-3 py-2 text-xs w-full bg-background min-h-[60px] resize-y"
                value={settings.maintenanceMessage}
                onChange={(e) => update('maintenanceMessage', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Contact Details & Location ── */}
        <Card className="shadow-xs border bg-card">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" /> Official Contact & Location
            </CardTitle>
            <CardDescription className="text-xs">
              Agency email, phone, physical address, and Google Maps embed URL.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Public Contact Email</Label>
                <Input
                  className="text-xs"
                  value={settings.email}
                  onChange={(e) => update('email', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Public Telephone Number</Label>
                <Input
                  className="text-xs"
                  value={settings.phone}
                  onChange={(e) => update('phone', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Physical Office Address</Label>
              <Input
                className="text-xs"
                value={settings.address}
                onChange={(e) => update('address', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Google Maps Embed URL</Label>
              <Input
                className="text-xs font-mono"
                value={settings.googleMapsUrl}
                onChange={(e) => update('googleMapsUrl', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Analytics & Social Links ── */}
        <Card className="shadow-xs border bg-card">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Share2 className="h-4 w-4 text-primary" /> Social Channels & Analytics
            </CardTitle>
            <CardDescription className="text-xs">
              Official social media profiles and Google Analytics tracking ID.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Google Analytics (GA4 / GTM ID)</Label>
              <Input
                className="text-xs font-mono"
                placeholder="G-XXXXXXXXXX"
                value={settings.analyticsId}
                onChange={(e) => update('analyticsId', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Facebook URL</Label>
                <Input
                  className="text-xs"
                  value={settings.socialLinks?.facebook || ''}
                  onChange={(e) => updateSocial('facebook', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Twitter / X URL</Label>
                <Input
                  className="text-xs"
                  value={settings.socialLinks?.twitter || ''}
                  onChange={(e) => updateSocial('twitter', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">YouTube URL</Label>
                <Input
                  className="text-xs"
                  value={settings.socialLinks?.youtube || ''}
                  onChange={(e) => updateSocial('youtube', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Instagram URL</Label>
                <Input
                  className="text-xs"
                  value={settings.socialLinks?.instagram || ''}
                  onChange={(e) => updateSocial('instagram', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── SMTP Email Server Configuration ── */}
        <Card className="shadow-xs border bg-card lg:col-span-2">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" /> SMTP System Email Configuration
            </CardTitle>
            <CardDescription className="text-xs">
              Outgoing mail server settings for automated notification emails and password resets.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">SMTP Host Server</Label>
                <Input
                  className="text-xs font-mono"
                  placeholder="smtp.gov.ph"
                  value={settings.smtpHost}
                  onChange={(e) => update('smtpHost', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">SMTP Port</Label>
                <Input
                  className="text-xs font-mono"
                  type="number"
                  placeholder="587"
                  value={settings.smtpPort}
                  onChange={(e) => update('smtpPort', parseInt(e.target.value) || 587)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Encryption Protocol</Label>
                <select
                  className="border rounded-lg px-3 py-2 text-xs w-full bg-background"
                  value={settings.smtpEncryption}
                  onChange={(e) => update('smtpEncryption', e.target.value)}
                >
                  <option value="TLS">TLS (Recommended)</option>
                  <option value="SSL">SSL</option>
                  <option value="NONE">None</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">SMTP Username / Email</Label>
                <Input
                  className="text-xs"
                  value={settings.smtpUser}
                  onChange={(e) => update('smtpUser', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">SMTP Password</Label>
                <Input
                  className="text-xs"
                  type="password"
                  value={settings.smtpPassword || ''}
                  onChange={(e) => update('smtpPassword', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Sender Name Display</Label>
                <Input
                  className="text-xs"
                  value={settings.smtpSenderName}
                  onChange={(e) => update('smtpSenderName', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
