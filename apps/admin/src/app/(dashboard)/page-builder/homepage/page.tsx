'use client';

import * as React from 'react';
import {
  useHomepageSections,
  useSaveHomepageSections,
  usePublishHomepage,
  HomepageSection,
  SectionType,
  SECTION_TYPE_META,
} from '../../../../hooks/use-page-builder';
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
  Copy,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Send,
  Save,
  Monitor,
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

  const updateSections = (next: HomepageSection[]) => {
    const reordered = next.map((s: HomepageSection, i: number) => ({ ...s, order: i }));
    setSections(reordered);
    setHasChanges(true);
  };

  const addSection = (type: SectionType) => {
    const meta = SECTION_TYPE_META[type];
    const newSection: HomepageSection = {
      id: `sec-${Date.now()}`,
      type,
      title: meta.label,
      order: sections.length,
      isVisible: true,
      config: {},
    };
    updateSections([...sections, newSection]);
    setShowAddPanel(false);
    toast.success(`Added "${meta.label}" section to homepage`);
  };

  const removeSection = (id: string) => {
    const src = sections.find((s: HomepageSection) => s.id === id);
    updateSections(sections.filter((s: HomepageSection) => s.id !== id));
    toast.error(`Removed section "${src?.title || 'Section'}"`);
  };

  const duplicateSection = (id: string) => {
    const src = sections.find((s: HomepageSection) => s.id === id);
    if (!src) return;
    const dup: HomepageSection = { ...src, id: `sec-${Date.now()}`, title: `${src.title} (Copy)` };
    const idx = sections.findIndex((s: HomepageSection) => s.id === id);
    const next = [...sections];
    next.splice(idx + 1, 0, dup);
    updateSections(next);
    toast.success(`Duplicated "${src.title}"`);
  };

  const toggleVisibility = (id: string) => {
    const src = sections.find((s: HomepageSection) => s.id === id);
    const nextVisibility = !src?.isVisible;
    updateSections(
      sections.map((s: HomepageSection) => (s.id === id ? { ...s, isVisible: !s.isVisible } : s)),
    );
    toast.info(`Section "${src?.title}" is now ${nextVisibility ? 'Visible' : 'Hidden'}`);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    updateSections(next);
    toast.info(`Moved "${temp.title}" ${direction}`);
  };

  const handleSave = async () => {
    await saveMutation.mutateAsync(sections);
    setHasChanges(false);
    toast.success('Homepage layout saved successfully! Syncing live website...');
  };

  const handlePublish = async () => {
    await saveMutation.mutateAsync(sections);
    await publishMutation.mutateAsync();
    setHasChanges(false);
    toast.success('Homepage layout published live to official website!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Monitor className="h-6 w-6 text-primary" /> Homepage Section Builder
          </h1>
          <p className="text-xs text-muted-foreground">
            Compose your agency homepage by adding, reordering, and configuring visual sections — no coding required.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-amber-600 border-amber-500/30 text-[10px] font-bold animate-pulse">
              Unsaved Changes
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={handleSave} disabled={!hasChanges || saveMutation.isPending} className="font-semibold gap-1">
            <Save className="h-3.5 w-3.5" /> Save Draft
          </Button>
          <Button size="sm" onClick={handlePublish} disabled={publishMutation.isPending} className="font-bold gap-1 shadow-xs">
            <Send className="h-3.5 w-3.5" /> Publish Live
          </Button>
        </div>
      </div>

      {/* Section Canvas */}
      <Card className="shadow-xs border bg-card">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Layout Composition Canvas
            </CardTitle>
            <CardDescription className="text-xs">
              Drag sections up/down to reorder. Toggle visibility to hide sections without deleting.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowAddPanel(!showAddPanel)} className="text-xs font-semibold gap-1">
            <Plus className="h-3.5 w-3.5" /> Add Section
          </Button>
        </CardHeader>

        <CardContent className="p-6 space-y-3">
          {isLoading ? (
            <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">
              Loading homepage layout...
            </div>
          ) : sections.length > 0 ? (
            sections.map((section: HomepageSection, index: number) => {
              const meta = SECTION_TYPE_META[section.type];
              const IconComp = SECTION_ICON_MAP[meta.icon] || Sparkles;

              return (
                <div
                  key={section.id}
                  className={`flex items-center justify-between rounded-xl border p-4 shadow-2xs transition-all ${
                    section.isVisible
                      ? 'bg-card hover:border-foreground/30'
                      : 'bg-muted/30 opacity-60 border-dashed'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <IconComp className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{section.title}</span>
                        <Badge variant="outline" className="text-[9px] py-0 h-4 font-mono uppercase">
                          {section.type}
                        </Badge>
                        {!section.isVisible && (
                          <Badge variant="destructive" className="text-[9px] py-0 h-4">Hidden</Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{meta.description}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <div className="flex items-center border rounded-lg bg-muted/30 p-0.5 mr-2">
                      <button
                        disabled={index === 0}
                        className="p-1 hover:bg-background rounded text-muted-foreground disabled:opacity-30"
                        onClick={() => moveSection(index, 'up')}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        disabled={index === sections.length - 1}
                        className="p-1 hover:bg-background rounded text-muted-foreground disabled:opacity-30"
                        onClick={() => moveSection(index, 'down')}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleVisibility(section.id)}>
                      {section.isVisible ? <Eye className="h-3.5 w-3.5 text-emerald-600" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => duplicateSection(section.id)}>
                      <Copy className="h-3.5 w-3.5 text-primary" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" onClick={() => removeSection(section.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-40 border border-dashed rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/10">
              <Sparkles className="h-8 w-8 text-muted-foreground/40" />
              <span className="text-xs font-semibold">No sections added to the homepage yet.</span>
              <Button variant="outline" size="sm" onClick={() => setShowAddPanel(true)}>
                Add First Section
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Section Panel */}
      {showAddPanel && (
        <Card className="shadow-xs border bg-card">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" /> Choose Section Type
            </CardTitle>
            <CardDescription className="text-xs">
              Click a section type to append it to the homepage layout.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(Object.entries(SECTION_TYPE_META) as [SectionType, { label: string; description: string; icon: string }][]).map(
                ([type, meta]) => {
                  const IconComp = SECTION_ICON_MAP[meta.icon] || Sparkles;
                  return (
                    <button
                      key={type}
                      className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent hover:border-foreground/30 transition-all text-left"
                      onClick={() => addSection(type)}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <IconComp className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-foreground block">{meta.label}</span>
                        <span className="text-[10px] text-muted-foreground">{meta.description}</span>
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
