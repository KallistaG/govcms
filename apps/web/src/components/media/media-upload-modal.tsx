'use client';

import * as React from 'react';
import { UploadCloud, FileText, Image as ImageIcon, Video, X, CheckCircle2, Loader2 } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardFooter, Input, Label } from '@govcms/ui';

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (formData: FormData) => Promise<void>;
  currentFolderId?: string;
}

export const MediaUploadModal: React.FC<MediaUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  currentFolderId,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [altText, setAltText] = React.useState('');
  const [caption, setCaption] = React.useState('');
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const resetForm = React.useCallback(() => {
    setIsDragging(false);
    setSelectedFiles([]);
    setTitle('');
    setDescription('');
    setAltText('');
    setCaption('');
    setError(null);
  }, []);

  React.useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  if (!isOpen) return null;

  const appendFiles = (files: FileList | File[]) => {
    setSelectedFiles((prev) => {
      const next = [...prev];
      for (const file of Array.from(files)) {
        next.push(file);
      }
      return next;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      appendFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      appendFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFiles.length) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      for (const file of selectedFiles) {
        formData.append('files', file, file.name);
      }

      if (currentFolderId) {
        formData.append('folderId', currentFolderId);
      }

      if (title.trim()) {
        formData.append('title', title.trim());
      }

      if (description.trim()) {
        formData.append('description', description.trim());
      }

      if (altText.trim()) {
        formData.append('altText', altText.trim());
      }

      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }

      await onUpload(formData);
      resetForm();
      onClose();
    } catch (uploadError: any) {
      setError(uploadError?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const firstFile = selectedFiles[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-2xl shadow-2xl border bg-card">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UploadCloud className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg">Upload Media Assets</CardTitle>
              <CardDescription className="text-xs">
                Upload official images, PDFs, or videos to the media library.
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close upload dialog">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-primary bg-primary/10 scale-[0.99]'
                : selectedFiles.length
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-border hover:border-foreground/40 bg-muted/20'
            }`}
          >
            {selectedFiles.length ? (
              <div className="space-y-2 w-full">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
                <p className="text-sm font-bold text-foreground">
                  {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                </p>
                <div className="max-h-28 overflow-y-auto rounded-lg border bg-background/70 p-3 text-left text-xs space-y-1">
                  {selectedFiles.map((file) => (
                    <div key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center justify-between gap-3">
                      <span className="truncate font-medium">{file.name}</span>
                      <span className="font-mono text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                  ))}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                  Clear Selection
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <ImageIcon className="h-6 w-6 text-blue-500" />
                  <FileText className="h-6 w-6 text-amber-500" />
                  <Video className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Drag and drop files here, or <span className="text-primary underline">browse</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports PNG, JPG, WebP, PDF, MP4. You can select multiple files at once.
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  id="media-file-input"
                  onChange={handleFileChange}
                  accept="image/*,application/pdf,video/*"
                  multiple
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => document.getElementById('media-file-input')?.click()}
                >
                  Select Files from Computer
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Optional title for the uploaded media"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="altText">Alt Text</Label>
              <Input
                id="altText"
                placeholder="Accessibility text for image assets"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                disabled={!firstFile?.type.startsWith('image/')}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Optional internal description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="caption">Caption</Label>
            <Input
              id="caption"
              placeholder="Optional public caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          <CardFooter className="px-0 pt-4 border-t flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedFiles.length || isUploading} className="font-bold">
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading Asset...
                </>
              ) : (
                'Upload to Library'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
