'use client';

import * as React from 'react';
import {
  useMediaFolders,
  useCreateMediaFolder,
  useMediaAssets,
  useUploadMediaAsset,
  useUpdateMediaAsset,
  useDeleteMediaAsset,
  useBulkDeleteMediaAssets,
  useStorageStats,
  MediaAsset,
  MediaFolder,
} from '../../../../hooks/use-media';
import { MediaUploadModal } from '../../../../components/media/media-upload-modal';
import { MediaPreviewModal } from '../../../../components/media/media-preview-modal';
import { MediaRenameModal } from '../../../../components/media/media-rename-modal';
import { MediaReplaceModal } from '../../../../components/media/media-replace-modal';
import {
  FolderOpen,
  FolderPlus,
  UploadCloud,
  Search,
  Grid,
  List,
  FileText,
  Video,
  Trash2,
  Edit,
  HardDrive,
  Eye,
  Image as ImageIcon,
} from 'lucide-react';
import {
  Button,
  Input,
  Badge,
  Progress,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Checkbox,
} from '@govcms/ui';

export default function MediaLibraryPage() {
  const [currentFolderId, setCurrentFolderId] = React.useState<string | undefined>(undefined);
  const [search, setSearch] = React.useState('');
  const [mimeGroup, setMimeGroup] = React.useState('all');
  const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('grid');
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState('');
  const [previewAsset, setPreviewAsset] = React.useState<MediaAsset | null>(null);
  const [renameAsset, setRenameAsset] = React.useState<MediaAsset | null>(null);
  const [replaceAsset, setReplaceAsset] = React.useState<MediaAsset | null>(null);

  const { data: folders } = useMediaFolders();
  const createFolderMutation = useCreateMediaFolder();
  const { data: assets, isLoading } = useMediaAssets({
    folderId: currentFolderId,
    search,
    mimeType: mimeGroup !== 'all' ? mimeGroup : undefined,
  });
  const uploadMutation = useUploadMediaAsset();
  const updateMutation = useUpdateMediaAsset();
  const deleteMutation = useDeleteMediaAsset();
  const bulkDeleteMutation = useBulkDeleteMediaAssets();
  const { data: storage } = useStorageStats();

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName) return;
    await createFolderMutation.mutateAsync({ name: newFolderName, parentId: currentFolderId });
    setNewFolderName('');
    setIsNewFolderOpen(false);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && assets) {
      setSelectedIds(assets.map((a) => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Delete ${selectedIds.length} selected asset(s)?`)) {
      await bulkDeleteMutation.mutateAsync(selectedIds);
      setSelectedIds([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-primary" /> Media Asset Library
          </h1>
          <p className="text-xs text-muted-foreground">
            Centralized media asset repository for official images, documents, press kits, and media files.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsNewFolderOpen(true)} className="font-semibold gap-1 text-xs">
            <FolderPlus className="h-4 w-4 text-primary" /> New Folder
          </Button>
          <Button onClick={() => setIsUploadOpen(true)} className="font-bold gap-1 shadow-xs">
            <UploadCloud className="h-4 w-4" /> Upload Media
          </Button>
        </div>
      </div>

      {/* Storage Quota Usage Header Card */}
      <div className="p-4 bg-card border rounded-xl shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="flex items-center gap-1.5 font-bold text-foreground">
            <HardDrive className="h-4 w-4 text-primary" /> Agency Media Storage Quota
          </span>
          <span className="font-mono text-muted-foreground">
            {storage?.fileCount || assets?.length || 0} Files • {((storage?.usedBytes || 0) / (1024 * 1024 * 1024)).toFixed(2)} GB / 50.0 GB Used ({storage?.percentage || 28}%)
          </span>
        </div>
        <Progress value={storage?.percentage || 28} className="h-2" />
      </div>

      {/* Search & Folder Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search media files by name or alt text..."
              className="pl-9 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
            value={mimeGroup}
            onChange={(e) => setMimeGroup(e.target.value)}
          >
            <option value="all">All File Types</option>
            <option value="image">Images (PNG, JPG, WebP)</option>
            <option value="document">Documents (PDF, DOCX)</option>
            <option value="video">Videos (MP4)</option>
          </select>

          <div className="flex items-center border rounded-lg p-0.5 bg-muted/40">
            <button
              className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-background shadow-2xs font-bold text-primary' : 'text-muted-foreground'}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              className={`p-1.5 rounded-md ${viewMode === 'table' ? 'bg-background shadow-2xs font-bold text-primary' : 'text-muted-foreground'}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Media Folders Bar */}
      {folders && folders.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shrink-0 transition-all ${
              !currentFolderId ? 'bg-primary text-primary-foreground border-primary font-bold' : 'bg-card text-muted-foreground hover:bg-accent'
            }`}
            onClick={() => setCurrentFolderId(undefined)}
          >
            <FolderOpen className="h-3.5 w-3.5" /> All Assets
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shrink-0 transition-all ${
                currentFolderId === folder.id ? 'bg-primary text-primary-foreground border-primary font-bold' : 'bg-card text-muted-foreground hover:bg-accent'
              }`}
              onClick={() => setCurrentFolderId(folder.id)}
            >
              <FolderOpen className="h-3.5 w-3.5 text-amber-500" /> {folder.name} ({folder.assetCount || 0})
            </button>
          ))}
        </div>
      )}

      {/* Selected Items Bulk Toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
          <span className="text-xs font-bold text-primary">{selectedIds.length} asset(s) selected</span>
          <Button variant="destructive" size="sm" className="h-8 text-xs font-bold gap-1" onClick={handleBulkDelete}>
            <Trash2 className="h-3.5 w-3.5" /> Bulk Delete Selected
          </Button>
        </div>
      )}

      {/* Main Asset View */}
      {isLoading ? (
        <div className="h-40 flex items-center justify-center text-xs text-muted-foreground">
          Loading media library...
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {assets?.map((asset) => {
            const isImage = asset.mimeType.startsWith('image/');
            const isPdf = asset.mimeType.includes('pdf');
            const isVideo = asset.mimeType.startsWith('video/');
            const isSelected = selectedIds.includes(asset.id);

            return (
              <div
                key={asset.id}
                className={`group relative rounded-xl border bg-card overflow-hidden shadow-2xs hover:shadow-md transition-all ${
                  isSelected ? 'ring-2 ring-primary border-primary' : ''
                }`}
              >
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleSelect(asset.id)}
                  />
                </div>

                <div
                  className="aspect-square bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer relative"
                  onClick={() => setPreviewAsset(asset)}
                >
                  {isImage ? (
                    <img src={asset.url} alt={asset.altText || asset.filename} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : isPdf ? (
                    <FileText className="h-10 w-10 text-amber-500" />
                  ) : isVideo ? (
                    <Video className="h-10 w-10 text-red-500" />
                  ) : (
                    <FileText className="h-10 w-10 text-blue-500" />
                  )}

                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full" title="Preview">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameAsset(asset);
                      }}
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-2.5 space-y-0.5">
                  <p className="text-xs font-bold truncate text-foreground" title={asset.filename}>
                    {asset.filename}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {Math.round(asset.size / 1024)} KB • {asset.dimensions || 'File'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectedIds.length === (assets?.length || 0) && (assets?.length || 0) > 0}
                    onCheckedChange={(c) => handleSelectAll(!!c)}
                  />
                </TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets?.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(asset.id)}
                      onCheckedChange={() => handleToggleSelect(asset.id)}
                    />
                  </TableCell>
                  <TableCell className="font-bold text-xs">
                    <span className="hover:text-primary cursor-pointer" onClick={() => setPreviewAsset(asset)}>
                      {asset.filename}
                    </span>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{asset.mimeType}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{Math.round(asset.size / 1024)} KB</TableCell>
                  <TableCell className="text-xs">{asset.uploadedByName}</TableCell>
                  <TableCell className="text-xs font-mono">{new Date(asset.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setPreviewAsset(asset)}>
                      Preview
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modals */}
      <MediaUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={async (data) => {
          const fd = new FormData();
          if (data.folderId) fd.append('folderId', data.folderId);
          if (data.altText) fd.append('altText', data.altText);
          await uploadMutation.mutateAsync(fd);
        }}
        currentFolderId={currentFolderId}
      />

      <MediaPreviewModal
        asset={previewAsset}
        isOpen={!!previewAsset}
        onClose={() => setPreviewAsset(null)}
        onRename={(a) => { setPreviewAsset(null); setRenameAsset(a); }}
        onReplace={(a) => { setPreviewAsset(null); setReplaceAsset(a); }}
        onDelete={async (id) => { await deleteMutation.mutateAsync(id); }}
      />

      <MediaRenameModal
        asset={renameAsset}
        isOpen={!!renameAsset}
        onClose={() => setRenameAsset(null)}
        onRename={async (id, filename, altText) => {
          await updateMutation.mutateAsync({ id, data: { filename, altText } });
        }}
      />

      <MediaReplaceModal
        asset={replaceAsset}
        isOpen={!!replaceAsset}
        onClose={() => setReplaceAsset(null)}
        onReplace={async (id, url, size) => {
          await updateMutation.mutateAsync({ id, data: { url, size } });
        }}
      />
    </div>
  );
}
