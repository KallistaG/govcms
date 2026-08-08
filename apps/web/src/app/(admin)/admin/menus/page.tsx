'use client';

import * as React from 'react';
import {
  useMenuByLocation,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  MenuItemData,
} from '../../../../hooks/use-menus';
import { MenuTreeBuilder } from '../../../../components/menus/menu-tree-builder';
import { MenuItemModal } from '../../../../components/menus/menu-item-modal';
import { Menu as MenuIcon, Plus, Globe, Shield, Layout, Layers } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@govcms/ui';

export default function MenuBuilderPage() {
  const [activeLocation, setActiveLocation] = React.useState<
    'HEADER_MENU' | 'FOOTER_MENU' | 'SIDEBAR_MENU'
  >('HEADER_MENU');

  const { data: menuData, isLoading } = useMenuByLocation(activeLocation);

  const createItemMutation = useCreateMenuItem();
  const updateItemMutation = useUpdateMenuItem();
  const deleteItemMutation = useDeleteMenuItem();

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<MenuItemData | null>(null);
  const [activeParentId, setActiveParentId] = React.useState<string | null>(null);

  const handleAddRootItem = () => {
    setEditingItem(null);
    setActiveParentId(null);
    setIsModalOpen(true);
  };

  const handleAddSubItem = (parentId: string) => {
    setEditingItem(null);
    setActiveParentId(parentId);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: MenuItemData) => {
    setEditingItem(item);
    setActiveParentId(item.parentId || null);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (formData: Partial<MenuItemData>) => {
    if (editingItem) {
      await updateItemMutation.mutateAsync({
        id: editingItem.id,
        data: formData,
      });
    } else {
      await createItemMutation.mutateAsync({
        ...formData,
        menuId: menuData?.id || 'menu-header',
        parentId: activeParentId,
      });
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Delete this menu item and its sub-links?')) {
      await deleteItemMutation.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <MenuIcon className="h-6 w-6 text-primary" /> Navigation Menu Builder
          </h1>
          <p className="text-xs text-muted-foreground">
            Configure header, footer, and sidebar portal navigation trees for public site visitors.
          </p>
        </div>

        <Button onClick={handleAddRootItem} className="font-bold gap-1 shadow-xs">
          <Plus className="h-4 w-4" /> Add Root Navigation Link
        </Button>
      </div>

      <div className="flex items-center gap-2 border-b pb-2">
        <button
          className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-all ${
            activeLocation === 'HEADER_MENU'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
          onClick={() => setActiveLocation('HEADER_MENU')}
        >
          <Globe className="h-4 w-4 text-amber-400" /> Header Navigation
        </button>

        <button
          className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-all ${
            activeLocation === 'FOOTER_MENU'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
          onClick={() => setActiveLocation('FOOTER_MENU')}
        >
          <Layout className="h-4 w-4 text-blue-400" /> Footer Navigation
        </button>

        <button
          className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-all ${
            activeLocation === 'SIDEBAR_MENU'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
          onClick={() => setActiveLocation('SIDEBAR_MENU')}
        >
          <Layers className="h-4 w-4 text-emerald-400" /> Sidebar Quick Links
        </button>
      </div>

      <Card className="shadow-xs border">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-base font-bold">
              {activeLocation === 'HEADER_MENU' && 'Public Website Header Menu'}
              {activeLocation === 'FOOTER_MENU' && 'Public Website Footer Links'}
              {activeLocation === 'SIDEBAR_MENU' && 'Public Sidebar Links'}
            </CardTitle>
            <CardDescription className="text-xs">
              Drag or use controls to reorder item hierarchy. Sub-items create dropdown menus.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleAddRootItem}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Link
          </Button>
        </CardHeader>

        <CardContent className="p-6">
          {isLoading ? (
            <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">
              Loading menu tree...
            </div>
          ) : (
            <MenuTreeBuilder
              items={menuData?.tree || []}
              onAddSubItem={handleAddSubItem}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
              onReorder={() => {}}
            />
          )}
        </CardContent>
      </Card>

      <MenuItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={editingItem}
        parentId={activeParentId}
      />
    </div>
  );
}
