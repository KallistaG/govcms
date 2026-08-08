'use client';

import * as React from 'react';
import {
  useThemeConfig,
  useSaveTheme,
  usePublishTheme,
  ThemeConfig,
} from '../../../../../hooks/use-theme';
import {
  Palette,
  Save,
  Send,
  Eye,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Label,
} from '@govcms/ui';

export default function ThemeSettingsPage() {
  const { data: initialTheme, isLoading } = useThemeConfig();
  const saveMutation = useSaveTheme();
  const publishMutation = usePublishTheme();

  const [theme, setTheme] = React.useState<ThemeConfig | null>(null);
  const [hasChanges, setHasChanges] = React.useState(false);

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

  const handleSave = async () => {
    if (!theme) return;
    await saveMutation.mutateAsync(theme);
    setHasChanges(false);
    toast.success('Saved theme draft configuration!');
  };

  const handlePublish = async () => {
    if (!theme) return;
    await saveMutation.mutateAsync(theme);
    await publishMutation.mutateAsync();
    setHasChanges(false);
    toast.success('Live theme successfully published to public website portal!');
  };

  if (isLoading || !theme) {
    return (
      <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">
        Loading theme configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Palette className="h-6 w-6 text-purple-500" /> Government Theme & Styling Manager
          </h1>
          <p className="text-xs text-muted-foreground">
            Custom brand colors, dynamic CSS variables, heading fonts, and portal header/footer styling.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSave} disabled={!hasChanges} className="gap-1">
            <Save className="h-4 w-4" /> Save Theme Draft
          </Button>
          <Button onClick={handlePublish} className="font-bold gap-1 shadow-xs bg-emerald-600 hover:bg-emerald-700">
            <Send className="h-4 w-4" /> Publish Live Theme
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Primary Brand Palette (HSL Tailored)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="primaryColor">Primary Agency Accent Color (Hex)</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      className="h-10 w-12 rounded border cursor-pointer p-1"
                      value={theme.primaryColor || '#1d4ed8'}
                      onChange={(e) => update('primaryColor', e.target.value)}
                    />
                    <Input
                      id="primaryColor"
                      value={theme.primaryColor || '#1d4ed8'}
                      onChange={(e) => update('primaryColor', e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="secondaryColor">Secondary Color (Hex)</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      className="h-10 w-12 rounded border cursor-pointer p-1"
                      value={theme.secondaryColor || '#7c3aed'}
                      onChange={(e) => update('secondaryColor', e.target.value)}
                    />
                    <Input
                      id="secondaryColor"
                      value={theme.secondaryColor || '#7c3aed'}
                      onChange={(e) => update('secondaryColor', e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fontHeading">Heading Font Family</Label>
                  <Input
                    id="fontHeading"
                    value={theme.fontHeading || 'Inter'}
                    onChange={(e) => update('fontHeading', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fontBody">Body Font Family</Label>
                  <Input
                    id="fontBody"
                    value={theme.fontBody || 'Inter'}
                    onChange={(e) => update('fontBody', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Eye className="h-4 w-4" /> Live HSL Theme Preview
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time preview of public portal components with current color scheme.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div
                className="p-4 rounded-xl text-white font-bold text-center shadow-lg transition-all"
                style={{ backgroundColor: theme.primaryColor || '#1d4ed8' }}
              >
                Primary Accent Button
              </div>
              <div
                className="p-4 rounded-xl text-white font-bold text-center shadow-lg transition-all"
                style={{ backgroundColor: theme.secondaryColor || '#7c3aed' }}
              >
                Secondary Accent Widget
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
