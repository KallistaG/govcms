'use client';

import * as React from 'react';
import {
  useContentList,
  useCreateContent,
  useUpdateContent,
  useDeleteContent,
  useBulkAction,
  ContentItem,
} from '../../../hooks/use-content';
import { ContentTable } from '../../../components/content/content-table';
import { ContentModal } from '../../../components/content/content-modal';
import { FileText, Newspaper, Megaphone, Calendar, Layers, Plus } from 'lucide-react';
import { Button } from '@govcms/ui';
import { toast } from 'sonner';

export default function ContentManagementPage() {
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [type, setType] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [activeTab, setActiveTab] = React.useState<'ALL' | 'PAGE_DOCUMENT' | 'PRESS_RELEASE' | 'PUBLIC_NOTICE' | 'EVENT'>('ALL');

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<ContentItem | null>(null);

  const activeTypeFilter = activeTab === 'ALL' ? type : activeTab;

  const { data, isLoading } = useContentList({
    search,
    status,
    type: activeTypeFilter,
    page,
    limit: 10,
  });

  const createMutation = useCreateContent();
  const updateMutation = useUpdateContent();
  const deleteMutation = useDeleteContent();
  const bulkMutation = useBulkAction();

  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ContentItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (formData: Partial<ContentItem>) => {
    if (editingItem) {
      await updateMutation.mutateAsync({ id: editingItem.id, data: formData });
      toast.success(`Updated document "${formData.title || editingItem.title}"`);
    } else {
      await createMutation.mutateAsync(formData);
      toast.success(`Created document "${formData.title || 'New Item'}"`);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('Are you sure you want to soft-delete this content item?')) {
      await deleteMutation.mutateAsync(id);
      toast.error('Content item moved to trash');
    }
  };

  const handleBulkAction = async (action: 'delete' | 'publish' | 'archive', ids: string[]) => {
    if (confirm(`Are you sure you want to apply bulk ${action} on ${ids.length} selected item(s)?`)) {
      await bulkMutation.mutateAsync({ action, ids });
      toast.success(`Applied bulk ${action} on ${ids.length} document(s)`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Content Management
          </h1>
          <p className="text-xs text-muted-foreground">
            Author, publish, edit, and manage government pages, press releases, public announcements, and events.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="font-bold gap-1 shadow-xs">
          <Plus className="h-4 w-4" /> Create Document
        </Button>
      </div>

      {/* Content Category Navigation Tabs */}
      <div className="flex items-center gap-1 border-b pb-2 overflow-x-auto">
        <button
          className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'ALL'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
          onClick={() => {
            setActiveTab('ALL');
            setPage(1);
          }}
        >
          <Layers className="h-4 w-4" /> All Content
        </button>

        <button
          className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'PAGE_DOCUMENT'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
          onClick={() => {
            setActiveTab('PAGE_DOCUMENT');
            setPage(1);
          }}
        >
          <FileText className="h-4 w-4" /> Pages
        </button>

        <button
          className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'PRESS_RELEASE'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
          onClick={() => {
            setActiveTab('PRESS_RELEASE');
            setPage(1);
          }}
        >
          <Newspaper className="h-4 w-4" /> News & Press Releases
        </button>

        <button
          className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'PUBLIC_NOTICE'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
          onClick={() => {
            setActiveTab('PUBLIC_NOTICE');
            setPage(1);
          }}
        >
          <Megaphone className="h-4 w-4" /> Public Notices
        </button>

        <button
          className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'EVENT'
              ? 'bg-primary text-primary-foreground shadow-xs'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
          onClick={() => {
            setActiveTab('EVENT');
            setPage(1);
          }}
        >
          <Calendar className="h-4 w-4" /> Events
        </button>
      </div>

      {/* TanStack Data Table Container */}
      <ContentTable
        data={data?.data || []}
        meta={data?.meta}
        isLoading={isLoading}
        selectedStatus={status}
        selectedType={type}
        onSearchChange={(query) => {
          setSearch(query);
          setPage(1);
        }}
        onStatusFilterChange={(st) => {
          setStatus(st);
          setPage(1);
        }}
        onTypeFilterChange={(tp) => {
          setType(tp);
          setPage(1);
        }}
        onPageChange={setPage}
        onEditItem={handleOpenEdit}
        onDeleteItem={handleDeleteItem}
        onBulkAction={handleBulkAction}
        onCreateNew={handleOpenCreate}
      />

      {/* Create / Edit Content Modal */}
      <ContentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={editingItem}
        defaultType={activeTab !== 'ALL' ? activeTab : 'PAGE_DOCUMENT'}
      />
    </div>
  );
}
