'use client';

import * as React from 'react';
import { MediaAsset } from '../../hooks/use-media';
import { X, Download, FileText, Video, Image as ImageIcon, Sparkles, Edit, Trash2 } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, Badge } from '@govcms/ui';

interface MediaPreviewModalProps {
  asset: MediaAsset | null;
  isOpen: boolean;
  onClose: () => void;
  onRename: (asset: MediaAsset) => void;
  onReplace: (asset: MediaAsset) => void;
  onDelete: (id: string) => void;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  asset,
  isOpen,
  onClose,
  onRename,
  onReplace,
  onDelete,
}) => {
  if (!isOpen || !asset) return null;

  const isImage = asset.mimeType.startsWith('image/');
  const isPdf = asset.mimeType === 'application/pdf';
  const isVideo = asset.mimeType.startsWith('video/');

  const formattedSize =
    asset.size > 1024 * 1024
      ? `${(asset.size / (1024 * 1024)).toFixed(2)} MB`
      : `${Math.round(asset.size / 1024)} KB`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-4xl shadow-2xl border bg-card max-h-[92vh] flex flex-col overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2 truncate">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {isImage && <ImageIcon className="h-4 w-4" />}
              {isPdf && <FileText className="h-4 w-4" />}
              {isVideo && <Video className="h-4 w-4" />}
            </div>
            <div className="truncate">
              <CardTitle className="text-base truncate">{asset.filename}</CardTitle>
              <CardDescription className="text-xs truncate">{asset.altText || asset.originalName}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <a href={asset.url} download target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
            </a>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 flex-1 overflow-hidden">
          {/* Main Media Preview Canvas */}
          <div className="lg:col-span-2 bg-muted/40 p-6 flex items-center justify-center min-h-[300px] border-r border-b lg:border-b-0 overflow-auto">
            {isImage && (
              <img
                src={asset.url}
                alt={asset.altText || asset.filename}
                className="max-h-[60vh] w-auto max-w-full rounded-lg shadow-md object-contain border bg-card"
              />
            )}

            {isPdf && (
              <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center gap-3">
                <iframe
                  src={asset.url}
                  className="w-full h-[450px] rounded-lg border bg-card shadow-xs"
                  title="PDF Preview"
                />
              </div>
            )}

            {isVideo && (
              <div className="w-full max-w-lg">
                <video controls className="w-full rounded-lg shadow-md border bg-black">
                  <source src={asset.url} type={asset.mimeType} />
                  Your browser does not support HTML5 video preview.
                </video>
              </div>
            )}
          </div>

          {/* Media Asset Inspector Panel */}
          <div className="p-5 space-y-4 overflow-y-auto bg-card flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Asset Details
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b">
                    <span className="text-muted-foreground">File Size</span>
                    <span className="font-bold font-mono text-foreground">{formattedSize}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b">
                    <span className="text-muted-foreground">MIME Type</span>
                    <span className="font-mono text-foreground">{asset.mimeType}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b">
                    <span className="text-muted-foreground">Dimensions</span>
                    <span className="font-mono text-foreground">{asset.dimensions || 'N/A'}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b">
                    <span className="text-muted-foreground">Optimization</span>
                    {asset.isOptimized ? (
                      <Badge variant="success" className="text-[9px]">WebP Optimized</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px]">Original</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between py-1 border-b">
                    <span className="text-muted-foreground">Uploaded By</span>
                    <span className="font-semibold text-foreground">{asset.uploadedByName}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b">
                    <span className="text-muted-foreground">Upload Date</span>
                    <span className="font-mono text-muted-foreground">
                      {new Date(asset.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {asset.altText && (
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Alt Text
                  </h4>
                  <p className="text-xs text-foreground bg-muted p-2 rounded border">
                    {asset.altText}
                  </p>
                </div>
              )}
            </div>

            {/* Asset Actions */}
            <div className="space-y-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-semibold justify-start"
                onClick={() => onRename(asset)}
              >
                <Edit className="h-3.5 w-3.5 mr-2 text-primary" /> Rename & Edit Alt Text
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-semibold justify-start"
                onClick={() => onReplace(asset)}
              >
                <Sparkles className="h-3.5 w-3.5 mr-2 text-amber-500" /> Replace File Version
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="w-full text-xs font-semibold justify-start"
                onClick={() => {
                  onDelete(asset.id);
                  onClose();
                }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Asset
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
