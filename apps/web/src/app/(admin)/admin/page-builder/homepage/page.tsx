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

const SECTION_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles, Images, Newspaper, LayoutGrid, Image: ImageIcon, BarChart3, Mail, MapPin, PanelBottom,
};

export default function HomepageBuilderPage() {
  const { data: initialSections = [], isLoading } = useHomepageSections();
  const saveMutation = useSaveHomepageSections();
  const publishMutation = usePublishHomepage();

  const [sections, setSections] = React.useState<HomepageSection[]>([]);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [showAddPanel, setShowAddPanel] = React.useState(false);

  React.useEffect(() => {
    if (initialSections.length > 0 && !hasChanges) {
      setSections(initialSections);
    }
  }, [initialSections, hasChanges]);

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
          <Button variant="outline" size="sm" onClick={handleSave} disabled={!hasChanges} className="gap-1">
            <Save className="h-4 w-4" /> Save Draft
          </Button>
          <Button size="sm" onClick={handlePublish} className="font-bold gap-1 shadow-xs bg-emerald-600 hover:bg-emerald-700">
            <Send className="h-4 w-4" /> Publish Live to Website
          </Button>
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
              <div className="pt-2">
                <Button className="w-full font-bold text-xs" onClick={handlePublish}>
                  Publish Live Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
