'use client';

import * as React from 'react';
import { MediaAsset } from '../../hooks/use-media';
import { Edit, X } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardFooter, Input, Label } from '@govcms/ui';

interface MediaRenameModalProps {
  asset: MediaAsset | null;
  isOpen: boolean;
  onClose: () => void;
  onRename: (
    id: string,
    data: {
      filename?: string;
      title?: string;
      altText?: string;
      caption?: string;
      description?: string;
    },
  ) => Promise<void>;
}

export const MediaRenameModal: React.FC<MediaRenameModalProps> = ({
  asset,
  isOpen,
  onClose,
  onRename,
}) => {
  const [filename, setFilename] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [altText, setAltText] = React.useState('');
  const [caption, setCaption] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (asset) {
      setFilename(asset.filename || '');
      setTitle(asset.title || asset.filename || '');
      setAltText(asset.altText || '');
      setCaption(asset.caption || '');
      setDescription(asset.description || '');
    }
  }, [asset]);

  if (!isOpen || !asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onRename(asset.id, {
        filename,
        title,
        altText,
        caption,
        description,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-md shadow-2xl border bg-card">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Edit className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg">Edit Media Metadata</CardTitle>
              <CardDescription className="text-xs">
                Update the display name and accessibility details for this asset.
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close metadata dialog">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="filename">Display Name</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="altText">Alt Text</Label>
            <Input
              id="altText"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="caption">Caption</Label>
            <Input
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <CardFooter className="px-0 pt-4 border-t flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="font-bold">
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
