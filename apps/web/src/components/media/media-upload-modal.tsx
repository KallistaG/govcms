'use client';

import * as React from 'react';
import { UploadCloud, FileText, Image as ImageIcon, Video, X, CheckCircle2, Loader2 } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardFooter, Input, Label } from '@govcms/ui';

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (fileData: { filename: string; originalName: string; mimeType: string; size: number; url: string; altText: string; folderId?: string }) => Promise<void>;
  currentFolderId?: string;
}

export const MediaUploadModal: React.FC<MediaUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  currentFolderId,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [altText, setAltText] = React.useState('');
  const [isUploading, setIsUploading] = React.useState(false);

  if (!isOpen) return null;

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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setAltText(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setAltText(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileUrl = (event.target?.result as string) || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop';
        await onUpload({
          filename: selectedFile.name,
          originalName: selectedFile.name,
          mimeType: selectedFile.type || 'image/png',
          size: selectedFile.size,
          url: fileUrl,
          altText: altText || selectedFile.name,
          folderId: currentFolderId,
        });
        setSelectedFile(null);
        setAltText('');
        onClose();
      };
      reader.readAsDataURL(selectedFile);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-lg shadow-2xl border bg-card">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UploadCloud className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg">Upload Media Assets</CardTitle>
              <CardDescription className="text-xs">
                Upload official images, PDFs, or videos to government media library.
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
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
                : selectedFile
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-border hover:border-foreground/40 bg-muted/20'
            }`}
          >
            {selectedFile ? (
              <div className="space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
                <p className="text-sm font-bold text-foreground">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type}
                </p>
                <Button type="button" variant="outline" size="sm" onClick={() => setSelectedFile(null)}>
                  Change Selected File
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
                    Supports PNG, JPG, WebP, PDF, MP4 (Max 100 MB per file)
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  id="media-file-input"
                  onChange={handleFileChange}
                  accept="image/*,application/pdf,video/*"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => document.getElementById('media-file-input')?.click()}
                >
                  Select File from Computer
                </Button>
              </div>
            )}
          </div>

          {selectedFile && (
            <div className="space-y-1.5">
              <Label htmlFor="altText">Alt Text / Image Caption (Accessibility & SEO)</Label>
              <Input
                id="altText"
                placeholder="Descriptive alt text for screen readers..."
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                required
              />
            </div>
          )}

          <CardFooter className="px-0 pt-4 border-t flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedFile || isUploading} className="font-bold">
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
