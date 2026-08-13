'use client';

import * as React from 'react';
import {
  useHomepageSections,
  useSaveHomepageSections,
  usePublishHomepage,
  HomepageSection,
  SectionType,
  SECTION_TYPE_META,
} from '../../../../../hooks/use-page-builder';
import { useSiteSettings } from '../../../../../hooks/use-site-settings';
import {
  Sparkles,
  Images,
  Newspaper,
  LayoutGrid,
  Image as ImageIcon,
  BarChart3,
  Mail,
  MapPin,
  PanelBottom,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Send,
  Save,
  Monitor,
  Tablet,
  Smartphone,
  X,
  Globe,
  CheckCircle2,
  AlertTriangle,
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
} from '@govcms/ui';
import { useAuth } from '../../../../../context/auth-context';
import { AdminAccessState } from '../../../../../components/auth/admin-access-state';
import { canEditHomepage, canPublishHomepage } from '../../../../../lib/admin-permissions';

const SECTION_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles, Images, Newspaper, LayoutGrid, Image: ImageIcon, BarChart3, Mail, MapPin, PanelBottom,
};

export default function HomepageBuilderPage() {
  const { user } = useAuth();
  const { data: initialSections = [], isLoading } = useHomepageSections();
  const { data: siteSettings } = useSiteSettings();
  const saveMutation = useSaveHomepageSections();
  const publishMutation = usePublishHomepage();
  const [sections, setSections] = React.useState<HomepageSection[]>([]);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [showAddPanel, setShowAddPanel] = React.useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [viewport, setViewport] = React.useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const canEdit = canEditHomepage(user);
  const canPublish = canPublishHomepage(user);

  React.useEffect(() => {
    if (initialSections.length > 0 && !hasChanges) {
      setSections(initialSections);
    }
  }, [initialSections, hasChanges]);

  if (!canEdit) {
    return (
      <AdminAccessState
        title="Homepage builder restricted"
        message="You do not have permission to edit the homepage layout."
      />
    );
  }

  const handleAddSection = (type: SectionType) => {
    const meta = SECTION_TYPE_META[type];
    const newSec: HomepageSection = {
      id: `sec-${type}-${Date.now()}`,
      type,
      title: meta.label,
      order: sections.length,
      isVisible: true,
      config: {},
    };

    setSections((prev) => [...prev, newSec]);
    setHasChanges(true);
    setShowAddPanel(false);
    toast.success(`Added ${meta.label} section`);
  };

  const handleToggleVisible = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isVisible: !s.isVisible } : s)),
    );
    setHasChanges(true);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    setSections(updated.map((s, idx) => ({ ...s, order: idx })));
    setHasChanges(true);
  };

  const handleDelete = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
    setHasChanges(true);
    toast.error('Section removed');
  };

  const handleSave = async () => {
    await saveMutation.mutateAsync(sections);
    setHasChanges(false);
    toast.success('Draft homepage layout saved');
  };

  const handlePublish = async () => {
    await publishMutation.mutateAsync(sections);
    setHasChanges(false);
    toast.success('Homepage changes live published to public website portal!');
  };

  const siteName = siteSettings?.siteName || siteSettings?.websiteName || '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" /> Homepage Builder Engine
          </h1>
          <p className="text-xs text-muted-foreground">
            Visual drag-and-drop homepage section architect for government portal layout configuration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(true)} className="gap-1 font-bold text-xs">
            <Eye className="h-4 w-4 text-primary" /> Live Preview
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={!hasChanges} className="gap-1 font-semibold text-xs">
            <Save className="h-4 w-4" /> Save Draft
          </Button>
          {canPublish && (
            <Button size="sm" onClick={handlePublish} className="font-bold gap-1 shadow-xs bg-emerald-600 hover:bg-emerald-700 text-xs">
              <Send className="h-4 w-4" /> Publish Live
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center gap-2">
              Active Sections ({sections.length})
            </h2>
            <Button size="sm" variant="secondary" onClick={() => setShowAddPanel(!showAddPanel)} className="font-bold text-xs gap-1">
              <Plus className="h-4 w-4" /> Add Homepage Section
            </Button>
          </div>

          {showAddPanel && (
            <Card className="border-2 border-primary/40 bg-primary/5 p-4 space-y-3 animate-in fade-in-50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                Select Section Type to Append
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {(Object.keys(SECTION_TYPE_META) as SectionType[]).map((key) => {
                  const meta = SECTION_TYPE_META[key];
                  const IconComp = SECTION_ICON_MAP[meta.icon] || Sparkles;

                  return (
                    <button
                      key={key}
                      type="button"
                      className="p-3 rounded-lg border bg-card hover:bg-accent text-left transition-all space-y-1 group"
                      onClick={() => handleAddSection(key)}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs text-foreground group-hover:text-primary">
                        <IconComp className="h-4 w-4 text-primary" /> {meta.label}
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">{meta.description}</p>
                    </button>
                  );
                })}
              </div>
            </Card>
          )}

          {isLoading ? (
            <div className="h-40 border rounded-xl flex items-center justify-center text-xs text-muted-foreground">
              Loading homepage sections...
            </div>
          ) : (
            <div className="space-y-3">
              {sections.map((section, index) => {
                const meta = SECTION_TYPE_META[section.type] || { label: section.title, icon: 'Sparkles' };
                const IconComp = SECTION_ICON_MAP[meta.icon] || Sparkles;

                return (
                  <Card
                    key={section.id}
                    className={`border transition-all ${!section.isVisible ? 'opacity-60 bg-muted/30' : 'bg-card'}`}
                  >
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <IconComp className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{section.title}</span>
                            <Badge variant="outline" className="text-[9px] uppercase font-mono">
                              {section.type}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground">Section #{index + 1} order index</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <div className="flex items-center border rounded-lg p-0.5 bg-muted/40 mr-2">
                          <button
                            disabled={index === 0}
                            className="p-1 hover:bg-background rounded disabled:opacity-30"
                            onClick={() => handleMove(index, 'up')}
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            disabled={index === sections.length - 1}
                            className="p-1 hover:bg-background rounded disabled:opacity-30"
                            onClick={() => handleMove(index, 'down')}
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleVisible(section.id)}
                          title={section.isVisible ? 'Hide Section' : 'Show Section'}
                        >
                          {section.isVisible ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(section.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Homepage Live Status</CardTitle>
              <CardDescription className="text-xs">
                Real-time configuration overview for public portal homepage rendering.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Visible Sections</span>
                <span className="font-bold text-foreground font-mono">{sections.filter((s) => s.isVisible).length} / {sections.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Unsaved Changes</span>
                <span className={`font-bold font-mono ${hasChanges ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {hasChanges ? 'Yes (Draft)' : 'None (Synced)'}
                </span>
              </div>
              <div className="pt-2 space-y-2">
                <Button variant="outline" className="w-full font-bold text-xs gap-1" onClick={() => setIsPreviewOpen(true)}>
                  <Eye className="h-4 w-4 text-primary" /> Open Live Preview
                </Button>
                {canPublish && (
                  <Button className="w-full font-bold text-xs bg-emerald-600 hover:bg-emerald-700" onClick={handlePublish}>
                    Publish Live Configuration
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Live Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-between animate-in fade-in-50">
          {/* Header Controls */}
          <div className="bg-slate-900 border-b border-slate-800 text-white px-6 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <span className="font-bold text-sm">Live Website Homepage Preview</span>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                Interactive Render Mode
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              {/* Viewport Toggles */}
              <div className="flex items-center border border-slate-700 rounded-lg p-1 bg-slate-950">
                <button
                  type="button"
                  className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    viewport === 'desktop' ? 'bg-primary text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                  onClick={() => setViewport('desktop')}
                >
                  <Monitor className="h-3.5 w-3.5" /> Desktop
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    viewport === 'tablet' ? 'bg-primary text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                  onClick={() => setViewport('tablet')}
                >
                  <Tablet className="h-3.5 w-3.5" /> Tablet
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    viewport === 'mobile' ? 'bg-primary text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                  onClick={() => setViewport('mobile')}
                >
                  <Smartphone className="h-3.5 w-3.5" /> Mobile
                </button>
              </div>

              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800" onClick={() => setIsPreviewOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Preview Viewport Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-950/60">
            <div
              className={`bg-background text-foreground shadow-2xl rounded-2xl border transition-all duration-300 flex flex-col ${
                viewport === 'desktop'
                  ? 'w-full max-w-6xl min-h-[700px]'
                  : viewport === 'tablet'
                  ? 'w-[768px] min-h-[700px]'
                  : 'w-[380px] min-h-[700px]'
              }`}
            >
              {/* Top Banner */}
              {siteSettings?.maintenanceMode && (
                <div className="bg-amber-600 text-white px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2">
                  <AlertTriangle className="h-4 w-4 animate-bounce" />
                  <span>Scheduled System Maintenance Active</span>
                </div>
              )}

              {/* Website Header */}
              <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                    <Globe className="h-4 w-4" />
                  </div>
                  <span className="font-black text-sm text-foreground tracking-tight">{siteName}</span>
                </div>
                <nav className="hidden sm:flex items-center gap-3 text-xs font-semibold text-muted-foreground">
                  <span className="text-primary font-bold">Home</span>
                  <span>News & Press</span>
                  <span>Services</span>
                  <span>Downloads</span>
                </nav>
              </header>

              {/* Dynamic Section Renders */}
              <div className="p-6 space-y-8 flex-1">
                {sections
                  .filter((s) => s.isVisible)
                  .map((sec) => (
                    <div key={sec.id} className="space-y-4 border p-6 rounded-2xl bg-card shadow-2xs relative">
                      <Badge className="absolute top-3 right-3 text-[9px] uppercase font-mono bg-primary/10 text-primary border-primary/20">
                        {sec.type}
                      </Badge>

                      {sec.type === 'hero' && (
                        <div className="text-center py-8 space-y-4 max-w-2xl mx-auto">
                          <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5">
                            Official Agency Web Portal
                          </Badge>
                          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground leading-tight">
                            {(sec.config?.headline as string) || siteName}
                          </h2>
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {(sec.config?.subtext as string) || siteSettings?.tagline || siteSettings?.description || ''}
                          </p>
                          <div className="pt-2 flex justify-center gap-3">
                            <Button className="font-bold text-xs px-6 shadow-md">Explore Services</Button>
                            <Button variant="outline" className="font-bold text-xs px-6">Read Press Releases</Button>
                          </div>
                        </div>
                      )}

                      {sec.type === 'news' && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Newspaper className="h-5 w-5 text-primary" /> Latest Agency News & Releases
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {[1, 2, 3].map((n) => (
                              <div key={n} className="border rounded-xl p-4 bg-background space-y-2 hover:border-primary/50 transition-colors">
                                <Badge variant="secondary" className="text-[10px]">Official Notice #{n}</Badge>
                                <h4 className="font-bold text-xs text-foreground line-clamp-2">
                                  Scheduled Service Maintenance and System Upgrade Advisory
                                </h4>
                                <p className="text-[11px] text-muted-foreground line-clamp-2">
                                  Official advisory issued regarding upcoming infrastructure enhancements.
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {sec.type === 'cards' && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <LayoutGrid className="h-5 w-5 text-primary" /> Public Services & E-Services
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                              { title: 'FOI Downloads', desc: 'Access public freedom of information records.' },
                              { title: 'Public Advisories', desc: 'Read latest announcements and circulars.' },
                              { title: 'Citizen Charter', desc: 'Service guidelines and official procedures.' },
                            ].map((card, idx) => (
                              <div key={idx} className="border p-4 rounded-xl bg-background space-y-2">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                <h4 className="font-bold text-xs text-foreground">{card.title}</h4>
                                <p className="text-[11px] text-muted-foreground">{card.desc}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {sec.type === 'statistics' && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 text-center">
                          {[
                            { label: 'Published Records', val: '1,200+' },
                            { label: 'Satisfaction Rate', val: '99.4%' },
                            { label: 'Service Coverage', val: '100%' },
                            { label: 'Support Desk', val: '24/7' },
                          ].map((st, idx) => (
                            <div key={idx} className="p-3 border rounded-xl bg-background">
                              <span className="font-black text-xl text-primary font-mono">{st.val}</span>
                              <p className="text-[10px] text-muted-foreground font-semibold uppercase">{st.label}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {sec.type !== 'hero' && sec.type !== 'news' && sec.type !== 'cards' && sec.type !== 'statistics' && (
                        <div className="py-6 text-center text-xs text-muted-foreground space-y-1">
                          <h3 className="font-bold text-foreground">{sec.title}</h3>
                          <p>Interactive preview rendered for {sec.type} section component.</p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {/* Website Footer Preview */}
              <footer className="bg-slate-950 text-slate-400 p-6 border-t border-slate-800 text-xs space-y-2">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Globe className="h-4 w-4 text-primary" /> {siteName}
                </div>
                <p className="text-[11px] text-slate-500">
                  © {new Date().getFullYear()} {siteName || 'Official Agency Portal'}. All rights reserved.
                </p>
              </footer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
