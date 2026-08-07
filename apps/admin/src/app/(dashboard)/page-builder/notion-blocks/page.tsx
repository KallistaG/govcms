'use client';

import * as React from 'react';
import {
  usePageBlocks,
  useSavePageBlocks,
  usePublishPage,
  PageBlock,
  BlockType,
  BLOCK_TYPE_META,
} from '../../../../hooks/use-page-builder';
import {
  Heading,
  AlignLeft,
  Image as ImageIcon,
  Images,
  LayoutGrid,
  ListCollapse,
  Quote,
  Minus,
  Video,
  FileText,
  MousePointer,
  Download,
  MapPin,
  Table,
  Columns3,
  Sparkles,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Save,
  Send,
  Blocks,
  Settings,
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

const BLOCK_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Heading, AlignLeft, Image: ImageIcon, Images, LayoutGrid, ListCollapse, Quote,
  Minus, Video, FileText, MousePointer, Download, MapPin, Table, Columns3, Sparkles,
};

export default function NotionBlockBuilderPage() {
  const slug = 'about-agency';
  const pageTitle = 'About Our Agency';

  const { data: initialBlocks = [], isLoading } = usePageBlocks(slug);
  const saveMutation = useSavePageBlocks();
  const publishMutation = usePublishPage();

  const [blocks, setBlocks] = React.useState<PageBlock[]>([]);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [showAddPanel, setShowAddPanel] = React.useState(false);
  const [editingBlock, setEditingBlock] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (initialBlocks.length > 0 && blocks.length === 0) {
      setBlocks(initialBlocks);
    }
  }, [initialBlocks, blocks.length]);

  const updateBlocks = (next: PageBlock[]) => {
    const reordered = next.map((b: PageBlock, i: number) => ({ ...b, order: i }));
    setBlocks(reordered);
    setHasChanges(true);
  };

  const addBlock = (type: BlockType) => {
    const defaultConfig = getDefaultConfig(type);
    const meta = BLOCK_TYPE_META[type];
    const newBlock: PageBlock = {
      id: `blk-${Date.now()}`,
      type,
      order: blocks.length,
      collapsed: false,
      config: defaultConfig,
    };
    updateBlocks([...blocks, newBlock]);
    setShowAddPanel(false);
    toast.success(`Added "${meta.label}" block to page`);
  };

  const removeBlock = (id: string) => {
    const src = blocks.find((b: PageBlock) => b.id === id);
    const meta = BLOCK_TYPE_META[src?.type || 'paragraph'];
    updateBlocks(blocks.filter((b: PageBlock) => b.id !== id));
    toast.error(`Removed "${meta.label}" block`);
  };

  const duplicateBlock = (id: string) => {
    const src = blocks.find((b: PageBlock) => b.id === id);
    if (!src) return;
    const meta = BLOCK_TYPE_META[src.type];
    const dup: PageBlock = { ...src, id: `blk-${Date.now()}` };
    const idx = blocks.findIndex((b: PageBlock) => b.id === id);
    const next = [...blocks];
    next.splice(idx + 1, 0, dup);
    updateBlocks(next);
    toast.success(`Duplicated "${meta.label}" block`);
  };

  const toggleCollapse = (id: string) => {
    setBlocks(blocks.map((b: PageBlock) => (b.id === id ? { ...b, collapsed: !b.collapsed } : b)));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    updateBlocks(next);
    const meta = BLOCK_TYPE_META[temp.type];
    toast.info(`Moved "${meta.label}" block ${direction}`);
  };

  const updateBlockConfig = (id: string, key: string, value: unknown) => {
    setBlocks(
      blocks.map((b: PageBlock) =>
        b.id === id ? { ...b, config: { ...b.config, [key]: value } } : b,
      ),
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    await saveMutation.mutateAsync({ slug, title: pageTitle, blocks });
    setHasChanges(false);
    toast.success('Page blocks saved successfully! Syncing live website...');
  };

  const handlePublish = async () => {
    await saveMutation.mutateAsync({ slug, title: pageTitle, blocks });
    await publishMutation.mutateAsync(slug);
    setHasChanges(false);
    toast.success('Page published live to official website!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Blocks className="h-6 w-6 text-primary" /> Notion Block Page Builder
          </h1>
          <p className="text-xs text-muted-foreground">
            Compose rich pages using modular content blocks — headings, paragraphs, images, galleries, tables, accordions, and more.
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
            <Send className="h-3.5 w-3.5" /> Publish Page
          </Button>
        </div>
      </div>

      {/* Block Canvas */}
      <Card className="shadow-xs border bg-card">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Blocks className="h-4 w-4 text-primary" /> Content Blocks
            </CardTitle>
            <CardDescription className="text-xs">
              Each block represents a modular content unit. Reorder, collapse, duplicate, or delete blocks freely.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowAddPanel(!showAddPanel)} className="text-xs font-semibold gap-1">
            <Plus className="h-3.5 w-3.5" /> Add Block
          </Button>
        </CardHeader>

        <CardContent className="p-6 space-y-3">
          {isLoading ? (
            <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">
              Loading page blocks...
            </div>
          ) : blocks.length > 0 ? (
            blocks.map((block: PageBlock, index: number) => {
              const meta = BLOCK_TYPE_META[block.type];
              const IconComp = BLOCK_ICON_MAP[meta.icon] || Sparkles;
              const isEditing = editingBlock === block.id;

              return (
                <div key={block.id} className="rounded-xl border bg-card shadow-2xs hover:border-foreground/20 transition-all">
                  {/* Block Header Row */}
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />

                      <button
                        className="flex items-center gap-1 text-muted-foreground hover:text-foreground shrink-0"
                        onClick={() => toggleCollapse(block.id)}
                      >
                        {block.collapsed ? (
                          <ChevronRight className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>

                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <IconComp className="h-4 w-4" />
                      </div>

                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-xs text-foreground">{meta.label}</span>
                        <Badge variant="outline" className="text-[9px] py-0 h-4 font-mono uppercase">
                          {block.type}
                        </Badge>
                        {getBlockPreview(block) && (
                          <span className="text-[10px] text-muted-foreground truncate max-w-[250px]">
                            — {getBlockPreview(block)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <div className="flex items-center border rounded-lg bg-muted/30 p-0.5 mr-1">
                        <button
                          disabled={index === 0}
                          className="p-1 hover:bg-background rounded text-muted-foreground disabled:opacity-30"
                          onClick={() => moveBlock(index, 'up')}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          disabled={index === blocks.length - 1}
                          className="p-1 hover:bg-background rounded text-muted-foreground disabled:opacity-30"
                          onClick={() => moveBlock(index, 'down')}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <Button
                        variant="ghost" size="sm" className="h-7 w-7 p-0"
                        onClick={() => setEditingBlock(isEditing ? null : block.id)}
                      >
                        <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => duplicateBlock(block.id)}>
                        <Copy className="h-3.5 w-3.5 text-primary" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" onClick={() => removeBlock(block.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Inline Block Settings (expanded when not collapsed and editing) */}
                  {!block.collapsed && isEditing && (
                    <div className="border-t p-4 bg-muted/10 space-y-3">
                      {renderBlockEditor(block, updateBlockConfig)}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="h-40 border border-dashed rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/10">
              <Blocks className="h-8 w-8 text-muted-foreground/40" />
              <span className="text-xs font-semibold">No content blocks yet. Start building your page.</span>
              <Button variant="outline" size="sm" onClick={() => setShowAddPanel(true)}>
                Add First Block
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Block Type Picker */}
      {showAddPanel && (
        <Card className="shadow-xs border bg-card">
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" /> Choose Block Type
            </CardTitle>
            <CardDescription className="text-xs">
              Click a block type to append it to the page composition.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {(Object.entries(BLOCK_TYPE_META) as [BlockType, { label: string; description: string; icon: string }][]).map(
                ([type, meta]) => {
                  const IconComp = BLOCK_ICON_MAP[meta.icon] || Sparkles;
                  return (
                    <button
                      key={type}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl border bg-card hover:bg-accent hover:border-foreground/30 transition-all text-center"
                      onClick={() => addBlock(type)}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <IconComp className="h-4 w-4" />
                      </div>
                      <span className="text-[11px] font-bold text-foreground">{meta.label}</span>
                      <span className="text-[9px] text-muted-foreground leading-tight">{meta.description}</span>
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDefaultConfig(type: BlockType): Record<string, unknown> {
  switch (type) {
    case 'heading': return { level: 2, text: '' };
    case 'paragraph': return { text: '' };
    case 'image': return { src: '', alt: '', caption: '' };
    case 'gallery': return { images: [] };
    case 'cards': return { items: [] };
    case 'accordion': return { items: [{ title: '', content: '' }] };
    case 'quote': return { text: '', author: '' };
    case 'divider': return {};
    case 'video': return { url: '', provider: 'youtube' };
    case 'pdf': return { url: '', title: '' };
    case 'button': return { label: '', url: '', variant: 'primary' };
    case 'download': return { label: '', url: '', fileSize: '' };
    case 'map': return { lat: 14.5995, lng: 120.9842, zoom: 14 };
    case 'table': return { headers: [], rows: [] };
    case 'columns': return { count: 2, content: [] };
    case 'hero': return { headline: '', subtext: '' };
    default: return {};
  }
}

function getBlockPreview(block: PageBlock): string {
  const c = block.config;
  switch (block.type) {
    case 'heading': return (c.text as string) || '';
    case 'paragraph': return ((c.text as string) || '').slice(0, 60);
    case 'image': return (c.alt as string) || (c.caption as string) || '';
    case 'quote': return ((c.text as string) || '').slice(0, 50);
    case 'button': return (c.label as string) || '';
    case 'video': return (c.url as string) || '';
    case 'hero': return (c.headline as string) || '';
    default: return '';
  }
}

function renderBlockEditor(
  block: PageBlock,
  update: (id: string, key: string, value: unknown) => void,
) {
  const c = block.config;
  const id = block.id;

  switch (block.type) {
    case 'heading':
      return (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Heading Level</Label>
            <select
              className="border rounded-lg px-3 py-1.5 text-xs w-full bg-background"
              value={(c.level as number) || 2}
              onChange={(e) => update(id, 'level', parseInt(e.target.value))}
            >
              <option value={1}>H1 — Page Title</option>
              <option value={2}>H2 — Section Title</option>
              <option value={3}>H3 — Subsection</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Heading Text</Label>
            <Input className="text-xs" value={(c.text as string) || ''} onChange={(e) => update(id, 'text', e.target.value)} placeholder="Enter heading text" />
          </div>
        </>
      );
    case 'paragraph':
      return (
        <div className="space-y-1">
          <Label className="text-xs">Paragraph Content</Label>
          <textarea
            className="border rounded-lg px-3 py-2 text-xs w-full bg-background min-h-[80px] resize-y"
            value={(c.text as string) || ''}
            onChange={(e) => update(id, 'text', e.target.value)}
            placeholder="Enter paragraph text..."
          />
        </div>
      );
    case 'image':
      return (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Image URL</Label>
            <Input className="text-xs" value={(c.src as string) || ''} onChange={(e) => update(id, 'src', e.target.value)} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Alt Text</Label>
              <Input className="text-xs" value={(c.alt as string) || ''} onChange={(e) => update(id, 'alt', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Caption</Label>
              <Input className="text-xs" value={(c.caption as string) || ''} onChange={(e) => update(id, 'caption', e.target.value)} />
            </div>
          </div>
        </>
      );
    case 'quote':
      return (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Quote Text</Label>
            <textarea className="border rounded-lg px-3 py-2 text-xs w-full bg-background min-h-[60px] resize-y" value={(c.text as string) || ''} onChange={(e) => update(id, 'text', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Author / Source</Label>
            <Input className="text-xs" value={(c.author as string) || ''} onChange={(e) => update(id, 'author', e.target.value)} />
          </div>
        </>
      );
    case 'video':
      return (
        <div className="space-y-1">
          <Label className="text-xs">Video URL (YouTube or Direct)</Label>
          <Input className="text-xs" value={(c.url as string) || ''} onChange={(e) => update(id, 'url', e.target.value)} placeholder="https://youtube.com/watch?v=..." />
        </div>
      );
    case 'button':
      return (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Button Label</Label>
            <Input className="text-xs" value={(c.label as string) || ''} onChange={(e) => update(id, 'label', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Target URL</Label>
            <Input className="text-xs" value={(c.url as string) || ''} onChange={(e) => update(id, 'url', e.target.value)} />
          </div>
        </div>
      );
    case 'hero':
      return (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Headline</Label>
            <Input className="text-xs" value={(c.headline as string) || ''} onChange={(e) => update(id, 'headline', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Subtext</Label>
            <Input className="text-xs" value={(c.subtext as string) || ''} onChange={(e) => update(id, 'subtext', e.target.value)} />
          </div>
        </>
      );
    case 'pdf':
    case 'download':
      return (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">{block.type === 'pdf' ? 'PDF Title' : 'Download Label'}</Label>
            <Input className="text-xs" value={((c.title || c.label) as string) || ''} onChange={(e) => update(id, block.type === 'pdf' ? 'title' : 'label', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">File URL</Label>
            <Input className="text-xs" value={(c.url as string) || ''} onChange={(e) => update(id, 'url', e.target.value)} />
          </div>
        </div>
      );
    case 'map':
      return (
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Latitude</Label>
            <Input className="text-xs" type="number" step="0.0001" value={(c.lat as number) || 0} onChange={(e) => update(id, 'lat', parseFloat(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Longitude</Label>
            <Input className="text-xs" type="number" step="0.0001" value={(c.lng as number) || 0} onChange={(e) => update(id, 'lng', parseFloat(e.target.value))} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Zoom Level</Label>
            <Input className="text-xs" type="number" min={1} max={20} value={(c.zoom as number) || 14} onChange={(e) => update(id, 'zoom', parseInt(e.target.value))} />
          </div>
        </div>
      );
    default:
      return (
        <p className="text-[10px] text-muted-foreground italic">
          Block configuration editor for &ldquo;{block.type}&rdquo; — extend inline settings as needed.
        </p>
      );
  }
}
