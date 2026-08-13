'use client';

import * as React from 'react';
import { MediaAsset } from '../../hooks/use-media';
import { Sparkles, X, UploadCloud, FileText, Image as ImageIcon, Video, CheckCircle2, Loader2 } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@govcms/ui';

interface MediaReplaceModalProps {
  asset: MediaAsset | null;
  isOpen: boolean;
  onClose: () => void;
  onReplace: (id: string, file: File) => Promise<void>;
}

export const MediaReplaceModal: React.FC<MediaReplaceModalProps> = ({
  asset,
  isOpen,
  onClose,
  onReplace,
}) => {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onReplace(asset.id, selectedFile);
      setSelectedFile(null);
      onClose();
    } catch (replaceError: any) {
      setError(replaceError?.message || 'Replacement failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isImage = asset.mimeType.startsWith('image/');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-2xl border bg-card">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg">Replace File Version</CardTitle>
              <CardDescription className="text-xs">
                Replace <span className="font-bold text-foreground">{asset.filename}</span> with a new file.
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close replace dialog">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="border-2 border-dashed rounded-xl p-6 text-center space-y-3 bg-muted/20">
            <UploadCloud className="h-8 w-8 text-primary mx-auto" />
            <div>
              <p className="text-xs font-bold text-foreground">Select Replacement File</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {isImage ? 'Image replacements preserve image workflows.' : `Must match the current mime type (${asset.mimeType}) when possible.`}
              </p>
            </div>
            <input
              type="file"
              className="text-xs text-muted-foreground border rounded p-2 w-full"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              accept={asset.mimeType.startsWith('image/') ? 'image/*' : asset.mimeType.startsWith('video/') ? 'video/*' : '*/*'}
            />
            {selectedFile && (
              <div className="space-y-2 rounded-lg border bg-background/70 p-3 text-left text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate font-medium">{selectedFile.name}</span>
                  <span className="font-mono text-muted-foreground">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  {selectedFile.type.startsWith('image/') ? (
                    <ImageIcon className="h-4 w-4" />
                  ) : selectedFile.type.startsWith('video/') ? (
                    <Video className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  <span>{selectedFile.type || 'unknown type'}</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Ready to replace</span>
                </div>
              </div>
            )}
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
            <Button type="submit" disabled={!selectedFile || isSubmitting} className="font-bold">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Replacing...
                </>
              ) : (
                'Replace File'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
