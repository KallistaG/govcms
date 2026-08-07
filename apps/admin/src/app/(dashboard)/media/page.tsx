'use client';

import * as React from 'react';
import {
  useMediaFolders,
  useCreateFolder,
  useMediaAssets,
  useUploadAsset,
  useRenameAsset,
  useReplaceAsset,
  useDeleteAsset,
  useBulkDeleteMedia,
  useStorageStats,
  MediaAsset,
  MediaFolder,
} from '../../../hooks/use-media';
import { MediaUploadModal } from '../../../components/media/media-upload-modal';
import { MediaPreviewModal } from '../../../components/media/media-preview-modal';
import { MediaRenameModal } from '../../../components/media/media-rename-modal';
import { MediaReplaceModal } from '../../../components/media/media-replace-modal';
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
  const [mimeType, setMimeType] = React.useState('all');
  const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('grid');
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState('');
  const [previewAsset, setPreviewAsset] = React.useState<MediaAsset | null>(null);
  const [renameAsset, setRenameAsset] = React.useState<MediaAsset | null>(null);
  const [replaceAsset, setReplaceAsset] = React.useState<MediaAsset | null>(null);

  // Queries & Mutations
  const { data: folders = [] } = useMediaFolders();
  const createFolderMutation = useCreateFolder();

  const { data: assets = [], isLoading } = useMediaAssets({
    search,
    folderId: currentFolderId,
    mimeType,
  });

  const uploadMutation = useUploadAsset();
  const renameMutation = useRenameAsset();
  const replaceMutation = useReplaceAsset();
  const deleteMutation = useDeleteAsset();
  const bulkDeleteMutation = useBulkDeleteMedia();
  const { data: storageStats } = useStorageStats();

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName) return;
    await createFolderMutation.mutateAsync(newFolderName);
    setNewFolderName('');
    setIsNewFolderOpen(false);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(assets.map((a: MediaAsset) => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.length} selected asset(s)?`)) {
      await bulkDeleteMutation.mutateAsync(selectedIds);
      setSelectedIds([]);
    }
  };

  const formattedUsedStorage = storageStats
    ? `${(storageStats.usedBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
    : '14.2 GB';
  const formattedTotalStorage = storageStats
    ? `${(storageStats.totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
    : '50.0 GB';

  return (
    <div className="space-y-6">
      {/* Top Header & Storage Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-primary" /> Agency Media Library
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage official agency photos, press release assets, PDF documents, and government video media.
          </p>
        </div>

        {/* Real-time Storage Usage Widget */}
        <div className="rounded-xl border bg-card p-3 shadow-xs min-w-[280px] space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <HardDrive className="h-3.5 w-3.5 text-primary" /> Storage Usage
            </span>
            <span className="font-mono text-foreground">
              {formattedUsedStorage} / {formattedTotalStorage} • {storageStats?.percentage || 28}%
            </span>
          </div>
          <Progress value={storageStats?.percentage || 28} className="h-2" />
        </div>
      </div>

      {/* Main Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card p-4 rounded-xl border shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search filenames, alt text or tags..."
            className="pl-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Format Filter */}
          <div className="flex items-center rounded-lg border bg-muted/40 p-1 text-xs">
            <button
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                mimeType === 'all' ? 'bg-background shadow-2xs font-bold text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setMimeType('all')}
            >
              All Formats
            </button>
            <button
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                mimeType === 'image' ? 'bg-background shadow-2xs font-bold text-blue-600' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setMimeType('image')}
            >
              Images
            </button>
            <button
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                mimeType === 'video' ? 'bg-background shadow-2xs font-bold text-red-600' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setMimeType('video')}
            >
              Videos
            </button>
            <button
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                mimeType === 'pdf' ? 'bg-background shadow-2xs font-bold text-amber-600' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setMimeType('pdf')}
            >
              PDFs
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border bg-muted/40 p-1">
            <button
              className={`p-1 rounded-md transition-all ${
                viewMode === 'grid' ? 'bg-background shadow-2xs text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              className={`p-1 rounded-md transition-all ${
                viewMode === 'table' ? 'bg-background shadow-2xs text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={() => setIsNewFolderOpen(true)} className="font-semibold gap-1">
            <FolderPlus className="h-4 w-4" /> New Folder
          </Button>
          <Button size="sm" onClick={() => setIsUploadOpen(true)} className="font-bold gap-1 shadow-xs">
            <UploadCloud className="h-4 w-4" /> Upload Files
          </Button>
        </div>
      </div>

      {/* Floating Bulk Delete Bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg animate-in fade-in-50">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="font-bold">
              {selectedIds.length} Selected
            </Badge>
            <span className="text-xs text-muted-foreground font-medium">
              Apply bulk operations to selected media assets
            </span>
          </div>

          <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="h-8 text-xs font-semibold gap-1">
            <Trash2 className="h-3.5 w-3.5" /> Bulk Delete Selected
          </Button>
        </div>
      )}

      {/* Folder Navigation Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
            !currentFolderId ? 'bg-primary text-primary-foreground border-primary shadow-xs' : 'bg-card text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setCurrentFolderId(undefined)}
        >
          <FolderOpen className="h-3.5 w-3.5" /> All Assets
        </button>

        {folders.map((f: MediaFolder) => (
          <button
            key={f.id}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              currentFolderId === f.id ? 'bg-primary text-primary-foreground border-primary shadow-xs' : 'bg-card text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setCurrentFolderId(f.id)}
          >
            <FolderOpen className="h-3.5 w-3.5 text-amber-500" /> {f.name}
            {f.assetCount !== undefined && (
              <span className="text-[10px] opacity-80 font-mono">({f.assetCount})</span>
            )}
          </button>
        ))}
      </div>

      {/* Main Content Layout: Grid or Table View */}
      {isLoading ? (
        <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
          Loading media library assets...
        </div>
      ) : assets.length > 0 ? (
        viewMode === 'grid' ? (
          /* Grid View Mode */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {assets.map((asset: MediaAsset) => {
              const isSelected = selectedIds.includes(asset.id);
              const isImage = asset.mimeType.startsWith('image/');
              const isPdf = asset.mimeType === 'application/pdf';
              const isVideo = asset.mimeType.startsWith('video/');

              return (
                <div
                  key={asset.id}
                  className={`group relative rounded-xl border bg-card overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between ${
                    isSelected ? 'ring-2 ring-primary border-primary' : ''
                  }`}
                >
                  {/* Thumbnail / Media Container */}
                  <div
                    className="h-40 bg-muted/30 relative flex items-center justify-center cursor-pointer overflow-hidden"
                    onClick={() => setPreviewAsset(asset)}
                  >
                    {isImage && (
                      <img
                        src={asset.url}
                        alt={asset.altText || asset.filename}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                    {isPdf && (
                      <div className="flex flex-col items-center gap-2 text-amber-600">
                        <FileText className="h-12 w-12" />
                        <span className="text-[10px] font-bold font-mono uppercase bg-amber-500/10 px-2 py-0.5 rounded">
                          PDF Document
                        </span>
                      </div>
                    )}
                    {isVideo && (
                      <div className="flex flex-col items-center gap-2 text-red-600">
                        <Video className="h-12 w-12" />
                        <span className="text-[10px] font-bold font-mono uppercase bg-red-500/10 px-2 py-0.5 rounded">
                          MP4 Video
                        </span>
                      </div>
                    )}

                    {/* Hover Overlay Button */}
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="sm" variant="secondary" className="h-8 text-xs font-bold">
                        <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                      </Button>
                    </div>

                    {/* Checkbox Select Overlay */}
                    <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleSelect(asset.id)}
                        className="bg-card shadow-md"
                      />
                    </div>
                  </div>

                  {/* Asset Details Footer */}
                  <div className="p-3 border-t space-y-1">
                    <p className="text-xs font-bold text-foreground truncate" title={asset.filename}>
                      {asset.filename}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                      <span>{(asset.size / 1024).toFixed(0)} KB</span>
                      <span>{asset.dimensions || 'File Asset'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View Mode */
          <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedIds.length === assets.length && assets.length > 0}
                      onCheckedChange={(v) => handleSelectAll(!!v)}
                    />
                  </TableHead>
                  <TableHead>Filename & Alt Text</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>File Size</TableHead>
                  <TableHead>Dimensions</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset: MediaAsset) => {
                  const isSelected = selectedIds.includes(asset.id);
                  return (
                    <TableRow key={asset.id} data-state={isSelected && 'selected'}>
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleSelect(asset.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col cursor-pointer" onClick={() => setPreviewAsset(asset)}>
                          <span className="font-bold text-xs text-foreground hover:text-primary transition-colors">
                            {asset.filename}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-xs">
                            {asset.altText || asset.originalName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{asset.mimeType}</TableCell>
                      <TableCell className="font-mono text-xs">{(asset.size / 1024).toFixed(0)} KB</TableCell>
                      <TableCell className="font-mono text-xs">{asset.dimensions || 'N/A'}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {new Date(asset.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setPreviewAsset(asset)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setRenameAsset(asset)}>
                            <Edit className="h-3.5 w-3.5 text-primary" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive" onClick={() => deleteMutation.mutate(asset.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )
      ) : (
        <div className="h-48 border border-dashed rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground bg-card">
          <FolderOpen className="h-8 w-8 text-muted-foreground/40" />
          <span className="text-xs font-semibold">No media files found in this folder.</span>
          <Button variant="outline" size="sm" onClick={() => setIsUploadOpen(true)}>
            Upload First File
          </Button>
        </div>
      )}

      {/* New Folder Modal */}
      {isNewFolderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border bg-card p-5 shadow-xl space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-primary" /> Create New Media Folder
            </h3>
            <form onSubmit={handleCreateFolder} className="space-y-3">
              <Input
                placeholder="e.g. Executive Orders 2026"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                required
              />
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsNewFolderOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="font-bold">
                  Create Folder
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals */}
      <MediaUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={async (data) => {
          await uploadMutation.mutateAsync(data);
        }}
        currentFolderId={currentFolderId}
      />

      <MediaPreviewModal
        asset={previewAsset}
        isOpen={!!previewAsset}
        onClose={() => setPreviewAsset(null)}
        onRename={(a) => setRenameAsset(a)}
        onReplace={(a) => setReplaceAsset(a)}
        onDelete={async (id) => {
          await deleteMutation.mutateAsync(id);
        }}
      />

      <MediaRenameModal
        asset={renameAsset}
        isOpen={!!renameAsset}
        onClose={() => setRenameAsset(null)}
        onRename={async (id, name, alt) => {
          await renameMutation.mutateAsync({ id, filename: name, altText: alt });
        }}
      />

      <MediaReplaceModal
        asset={replaceAsset}
        isOpen={!!replaceAsset}
        onClose={() => setReplaceAsset(null)}
        onReplace={async (id, url, size) => {
          await replaceMutation.mutateAsync({ id, newUrl: url, newSize: size });
        }}
      />
    </div>
  );
}
