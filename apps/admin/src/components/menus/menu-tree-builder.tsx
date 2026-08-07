'use client';

import * as React from 'react';
import { MenuItemData } from '../../hooks/use-menus';
import {
  GripVertical,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Link as LinkIcon,
  Home,
  Globe,
  Building2,
  Newspaper,
  FileText,
  Users,
  Phone,
  ShieldCheck,
  Award,
  LayoutDashboard,
  CornerDownRight,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Button, Badge } from '@govcms/ui';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Link: LinkIcon,
  Home,
  Globe,
  Building2,
  Newspaper,
  FileText,
  Users,
  Phone,
  ShieldCheck,
  ExternalLink,
  Award,
  LayoutDashboard,
};

interface MenuTreeBuilderProps {
  items: MenuItemData[];
  onAddSubItem: (parentId: string) => void;
  onEditItem: (item: MenuItemData) => void;
  onDeleteItem: (id: string) => void;
  onReorder: (newTree: MenuItemData[]) => void;
}

export const MenuTreeBuilder: React.FC<MenuTreeBuilderProps> = ({
  items,
  onAddSubItem,
  onEditItem,
  onDeleteItem,
  onReorder,
}) => {
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // Recalculate order index
    const reordered = updated.map((item, idx) => ({ ...item, order: idx }));
    onReorder(reordered);
  };

  const renderTreeNodes = (nodeList: MenuItemData[], depth = 0) => {
    return nodeList.map((node, index) => {
      const IconComponent = (node.icon && ICON_MAP[node.icon]) || LinkIcon;
      const hasChildren = node.children && node.children.length > 0;

      return (
        <div key={node.id} className="space-y-2">
          {/* Menu Item Node Card */}
          <div
            className={`flex items-center justify-between rounded-xl border bg-card p-3 shadow-2xs hover:border-foreground/30 transition-all ${
              depth > 0 ? 'ml-6 border-l-4 border-l-primary/40 bg-muted/20' : ''
            }`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex items-center gap-1 text-muted-foreground cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4" />
                {depth > 0 && <CornerDownRight className="h-3.5 w-3.5 text-primary" />}
              </div>

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <IconComponent className="h-4 w-4" />
              </div>

              <div className="flex flex-col truncate">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-foreground truncate">{node.title}</span>
                  {node.isExternal && (
                    <Badge variant="outline" className="text-[9px] py-0 h-4 border-blue-500/30 text-blue-600">
                      <ExternalLink className="h-2.5 w-2.5 mr-1" /> External
                    </Badge>
                  )}
                  {!node.isVisible && (
                    <Badge variant="destructive" className="text-[9px] py-0 h-4">
                      Hidden
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground font-mono truncate">{node.url}</span>
              </div>
            </div>

            {/* Item Controls */}
            <div className="flex items-center gap-1">
              <div className="flex items-center border rounded-lg bg-muted/30 p-0.5 mr-2">
                <button
                  type="button"
                  disabled={index === 0}
                  className="p-1 hover:bg-background rounded text-muted-foreground disabled:opacity-30"
                  onClick={() => moveItem(index, 'up')}
                  title="Move Up"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={index === nodeList.length - 1}
                  className="p-1 hover:bg-background rounded text-muted-foreground disabled:opacity-30"
                  onClick={() => moveItem(index, 'down')}
                  title="Move Down"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px] font-semibold gap-1"
                onClick={() => onAddSubItem(node.id)}
              >
                <Plus className="h-3 w-3" /> Sub-item
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onEditItem(node)}
                title="Edit Item"
              >
                <Edit className="h-3.5 w-3.5 text-primary" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                onClick={() => onDeleteItem(node.id)}
                title="Delete Item"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Render Nested Children Recursive Tree */}
          {hasChildren && renderTreeNodes(node.children!, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div className="space-y-3">
      {items.length > 0 ? (
        renderTreeNodes(items)
      ) : (
        <div className="h-40 border border-dashed rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground bg-card">
          <LinkIcon className="h-8 w-8 text-muted-foreground/40" />
          <span className="text-xs font-semibold">No menu navigation links created for this location yet.</span>
        </div>
      )}
    </div>
  );
};
