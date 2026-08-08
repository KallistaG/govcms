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

  const handleSave = async () => {
    if (!settings) return;
    try {
      await updateMutation.mutateAsync(settings);
      setHasChanges(false);
      toast.success('Website Settings successfully persisted to PostgreSQL database!');
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

        <Button onClick={handleSave} disabled={!hasChanges} className="font-bold gap-1 shadow-xs">
          <Save className="h-4 w-4" /> Save Settings to PostgreSQL
        </Button>
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
                Main site name and tagline displayed on public navigation and header footer components.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="siteName">Official Site / Agency Name</Label>
                <Input
                  id="siteName"
                  value={settings.siteName || settings.websiteName || ''}
                  onChange={(e) => update('siteName', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tagline">Agency Motto / Tagline</Label>
                <Input
                  id="tagline"
                  value={settings.tagline || settings.description || ''}
                  onChange={(e) => update('tagline', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="seoTitle">SEO Title Tag</Label>
                  <Input
                    id="seoTitle"
                    value={settings.seoTitle || ''}
                    onChange={(e) => update('seoTitle', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="keywords">SEO Keywords (Comma Separated)</Label>
                  <Input
                    id="keywords"
                    value={settings.keywords || ''}
                    onChange={(e) => update('keywords', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Details */}
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-500" /> Public Contact Information
              </CardTitle>
              <CardDescription className="text-xs">
                Official contact channels published on portal footer and public contact directory.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Official Agency Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email || ''}
                    onChange={(e) => update('email', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Hotline / Phone Number</Label>
                  <Input
                    id="phone"
                    value={settings.phone || ''}
                    onChange={(e) => update('phone', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address">Physical Agency Address</Label>
                <Input
                  id="address"
                  value={settings.address || ''}
                  onChange={(e) => update('address', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="googleMaps">Google Maps Embed Embed URL</Label>
                <Input
                  id="googleMaps"
                  value={settings.googleMaps || settings.googleMapsUrl || ''}
                  onChange={(e) => update('googleMaps', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Share2 className="h-5 w-5 text-purple-500" /> Social Media Channels
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="facebook">Facebook Page URL</Label>
                  <Input
                    id="facebook"
                    value={settings.facebook || ''}
                    onChange={(e) => update('facebook', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="twitter">X / Twitter URL</Label>
                  <Input
                    id="twitter"
                    value={settings.twitter || ''}
                    onChange={(e) => update('twitter', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Maintenance & Status Panel */}
        <div className="space-y-6">
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader className="border-b border-amber-500/20 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertOctagon className="h-5 w-5" /> Maintenance Mode Controls
              </CardTitle>
              <CardDescription className="text-xs">
                Enable to temporarily restrict public access during scheduled portal maintenance.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="maintenanceMode" className="font-bold text-xs cursor-pointer">
                  Maintenance Mode Active
                </Label>
                <input
                  id="maintenanceMode"
                  type="checkbox"
                  className="h-5 w-5 rounded accent-amber-500 cursor-pointer"
                  checked={settings.maintenanceMode}
                  onChange={(e) => update('maintenanceMode', e.target.checked)}
                />
              </div>

              {settings.maintenanceMode && (
                <div className="space-y-1.5 pt-2">
                  <Label htmlFor="maintenanceMessage">Public Notice Message</Label>
                  <Input
                    id="maintenanceMessage"
                    value={settings.maintenanceMessage || ''}
                    onChange={(e) => update('maintenanceMessage', e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
