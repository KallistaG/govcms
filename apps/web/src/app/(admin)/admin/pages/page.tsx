'use client';

import * as React from 'react';
import {
  usePageBlocks,
  useSavePageBlocks,
  BLOCK_TYPE_META,
  BlockType,
  PageBlock,
} from '../../../../hooks/use-page-builder';
import {
  Sparkles,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Save,
  FileText,
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
  Badge,
} from '@govcms/ui';

export default function PagesBlockBuilderPage() {
  const [selectedSlug, setSelectedSlug] = React.useState('about');
  const { data: initialBlocks = [], isLoading } = usePageBlocks(selectedSlug);
  const saveMutation = useSavePageBlocks();

  const [blocks, setBlocks] = React.useState<PageBlock[]>([]);
  const [hasChanges, setHasChanges] = React.useState(false);

  React.useEffect(() => {
    if (initialBlocks.length > 0 && !hasChanges) {
      setBlocks(initialBlocks);
    }
  }, [initialBlocks, hasChanges]);

  const handleAddBlock = (type: BlockType) => {
    const meta = BLOCK_TYPE_META[type];
    const newBlock: PageBlock = {
      id: `blk-${type}-${Date.now()}`,
      type,
      order: blocks.length,
      collapsed: false,
      config: { text: `New ${meta.label} block content` },
    };

    setBlocks((prev) => [...prev, newBlock]);
    setHasChanges(true);
    toast.success(`Added ${meta.label} block`);
  };

  const handleRemoveBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await saveMutation.mutateAsync({ slug: selectedSlug, blocks });
    setHasChanges(false);
    toast.success(`Saved page block configuration for "/pages/${selectedSlug}"`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Custom Page Builder
          </h1>
          <p className="text-xs text-muted-foreground">
            Configure dynamic block elements for government pages (`/pages/${selectedSlug}`).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="border rounded-lg px-3 py-1.5 text-xs font-bold bg-background"
            value={selectedSlug}
            onChange={(e) => {
              setSelectedSlug(e.target.value);
              setHasChanges(false);
            }}
          >
            <option value="about">/pages/about (About Agency)</option>
            <option value="services">/pages/services (Public e-Services)</option>
            <option value="transparency">/pages/transparency (Transparency Seal)</option>
            <option value="contact">/pages/contact (Contact Us)</option>
          </select>

          <Button size="sm" onClick={handleSave} disabled={!hasChanges} className="font-bold gap-1 shadow-xs">
            <Save className="h-4 w-4" /> Save Page Blocks
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Blocks for /pages/{selectedSlug} ({blocks.length})</h2>
          </div>

          {isLoading ? (
            <div className="h-40 border rounded-xl flex items-center justify-center text-xs text-muted-foreground">
              Loading blocks...
            </div>
          ) : (
            <div className="space-y-3">
              {blocks.map((block, idx) => {
                const meta = BLOCK_TYPE_META[block.type] || { label: block.type };
                return (
                  <Card key={block.id} className="border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-[10px]">#{idx + 1}</Badge>
                        <span className="font-bold text-xs">{meta.label}</span>
                        <span className="text-[11px] text-muted-foreground truncate max-w-xs">
                          {String(block.config?.text || block.type)}
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleRemoveBlock(block.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
              <CardTitle className="text-sm font-bold">Add Block Element</CardTitle>
              <CardDescription className="text-xs">Append rich layout blocks to current page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {(Object.keys(BLOCK_TYPE_META) as BlockType[]).map((key) => {
                const meta = BLOCK_TYPE_META[key];
                return (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs font-semibold"
                    onClick={() => handleAddBlock(key)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-2 text-primary" /> {meta.label}
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
