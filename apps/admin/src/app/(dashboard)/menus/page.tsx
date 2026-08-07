'use client';

import * as React from 'react';
import {
  useMenuDetails,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  useReorderMenuItems,
  MenuItemData,
} from '../../../hooks/use-menus';
import { MenuTreeBuilder } from '../../../components/menus/menu-tree-builder';
import { MenuItemModal } from '../../../components/menus/menu-item-modal';
import { Menu as MenuIcon, Plus, Globe, Shield, Layout, Layers } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@govcms/ui';

export default function MenuBuilderPage() {
  const [activeLocation, setActiveLocation] = React.useState<
    'HEADER_MENU' | 'FOOTER_MENU' | 'SIDEBAR_MENU'
  >('HEADER_MENU');

  const { data: menuData, isLoading } = useMenuDetails(activeLocation);

  const createItemMutation = useCreateMenuItem();
  const updateItemMutation = useUpdateMenuItem();
  const deleteItemMutation = useDeleteMenuItem();
  const reorderMutation = useReorderMenuItems();

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
        location: activeLocation,
        data: formData,
      });
    } else {
      await createItemMutation.mutateAsync({
        ...formData,
        location: activeLocation,
      });
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Are you sure you want to delete this menu item and all its sub-items?')) {
      await deleteItemMutation.mutateAsync({ id, location: activeLocation });
    }
  };

  const handleReorder = async (newTree: MenuItemData[]) => {
    await reorderMutation.mutateAsync({ location: activeLocation, newTree });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <MenuIcon className="h-6 w-6 text-primary" /> Enterprise Menu Builder
          </h1>
          <p className="text-xs text-muted-foreground">
            Configure header, footer, and sidebar navigation menus with unlimited nested levels, icons, and external links.
          </p>
        </div>

        <Button onClick={handleAddRootItem} className="font-bold gap-1 shadow-xs">
          <Plus className="h-4 w-4" /> Add Root Navigation Link
        </Button>
      </div>

      {/* Menu Location Switcher Tabs */}
      <div className="flex items-center gap-2 border-b pb-3">
        <button
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
            activeLocation === 'HEADER_MENU'
              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
              : 'bg-card text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveLocation('HEADER_MENU')}
        >
          <Globe className="h-4 w-4 text-secondary" /> Header Navigation Menu
        </button>

        <button
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
            activeLocation === 'FOOTER_MENU'
              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
              : 'bg-card text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveLocation('FOOTER_MENU')}
        >
          <Shield className="h-4 w-4 text-emerald-400" /> Footer Navigation Menu
        </button>

        <button
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
            activeLocation === 'SIDEBAR_MENU'
              ? 'bg-primary text-primary-foreground border-primary shadow-xs'
              : 'bg-card text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveLocation('SIDEBAR_MENU')}
        >
          <Layout className="h-4 w-4 text-amber-400" /> Sidebar Admin Menu
        </button>
      </div>

      {/* Interactive Menu Tree Builder Canvas */}
      <Card className="shadow-xs border bg-card">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" /> Navigation Hierarchy Tree
            </CardTitle>
            <CardDescription className="text-xs">
              Reorder items using position controls or indent sub-menus under parent items.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleAddRootItem} className="text-xs font-semibold gap-1">
            <Plus className="h-3.5 w-3.5" /> Add Root Item
          </Button>
        </CardHeader>

        <CardContent className="p-6">
          {isLoading ? (
            <div className="h-32 flex items-center justify-center text-xs text-muted-foreground">
              Loading navigation menu hierarchy...
            </div>
          ) : (
            <MenuTreeBuilder
              items={menuData?.tree || []}
              onAddSubItem={handleAddSubItem}
              onEditItem={handleEditItem}
              onDeleteItem={handleDeleteItem}
              onReorder={handleReorder}
            />
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Menu Item Modal */}
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
