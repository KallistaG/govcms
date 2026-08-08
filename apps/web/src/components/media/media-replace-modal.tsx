'use client';

import * as React from 'react';
import { MediaAsset } from '../../hooks/use-media';
import { Sparkles, X, UploadCloud } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@govcms/ui';

interface MediaReplaceModalProps {
  asset: MediaAsset | null;
  isOpen: boolean;
  onClose: () => void;
  onReplace: (id: string, newUrl: string, newSize: number) => Promise<void>;
}

export const MediaReplaceModal: React.FC<MediaReplaceModalProps> = ({
  asset,
  isOpen,
  onClose,
  onReplace,
}) => {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsSubmitting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileUrl = (event.target?.result as string) || asset.url;
        await onReplace(asset.id, fileUrl, selectedFile.size);
        setSelectedFile(null);
        onClose();
      };
      reader.readAsDataURL(selectedFile);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                Upload a new file version to replace <span className="font-bold text-foreground">{asset.filename}</span> without breaking URLs.
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="border-2 border-dashed rounded-xl p-6 text-center space-y-3 bg-muted/20">
            <UploadCloud className="h-8 w-8 text-primary mx-auto" />
            <div>
              <p className="text-xs font-bold text-foreground">Select Replacement File</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Must be compatible mime type ({asset.mimeType})
              </p>
            </div>
            <input
              type="file"
              className="text-xs text-muted-foreground border rounded p-2 w-full"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
          </div>

          <CardFooter className="px-0 pt-4 border-t flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedFile || isSubmitting} className="font-bold">
              Replace File
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
