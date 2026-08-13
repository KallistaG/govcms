'use client';

import * as React from 'react';
import { MediaAsset, useMediaAssets } from '../../hooks/use-media';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Badge } from '@govcms/ui';
import { Image as ImageIcon, FileText, Video, X, Search, Check } from 'lucide-react';

interface MediaPickerProps {
  value?: string | null;
  onChange: (url: string | null, asset?: MediaAsset | null) => void;
  label?: string;
  placeholder?: string;
  mimeType?: 'all' | 'image' | 'document' | 'video';
}

function getAssetLabel(asset: MediaAsset): string {
  return asset.title?.trim() || asset.filename?.trim() || asset.originalFilename?.trim() || 'Untitled media';
}

function getAssetUrl(asset: MediaAsset): string {
  return asset.secureUrl?.trim() || asset.url?.trim() || '';
}

export const MediaPicker: React.FC<MediaPickerProps> = ({
  value,
  onChange,
  label = 'Media',
  placeholder = 'Select media from library',
  mimeType = 'image',
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'image' | 'document' | 'video'>(mimeType);

  const { data: assets = [], isLoading } = useMediaAssets({
    search,
    mimeType: filter,
  });

  const selectedAsset = React.useMemo(
    () => assets.find((asset) => getAssetUrl(asset) === value) || null,
    [assets, value],
  );

  React.useEffect(() => {
    setFilter(mimeType);
  }, [mimeType]);

  const displayValue = selectedAsset
    ? getAssetLabel(selectedAsset)
    : value
      ? 'Selected media unavailable'
      : '';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold text-foreground">{label}</label>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground"
            onClick={() => onChange(null, null)}
          >
            Clear
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={displayValue}
          placeholder={placeholder}
          readOnly
          className="flex-1"
        />
        <Button type="button" variant="secondary" onClick={() => setIsOpen(true)}>
          Choose
        </Button>
      </div>

      {selectedAsset && (
        <div className="rounded-lg border bg-muted/20 p-2 text-xs">
          <div className="flex items-center gap-2">
            {selectedAsset.mimeType.startsWith('image/') ? (
              <ImageIcon className="h-4 w-4 text-primary" />
            ) : selectedAsset.mimeType.startsWith('video/') ? (
              <Video className="h-4 w-4 text-red-500" />
            ) : (
              <FileText className="h-4 w-4 text-amber-500" />
            )}
            <span className="font-medium truncate">{getAssetLabel(selectedAsset)}</span>
            <Badge variant="outline" className="text-[10px]">
              {selectedAsset.mimeType}
            </Badge>
          </div>
        </div>
      )}

      {!selectedAsset && value && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2 text-xs text-amber-700">
          The selected media item is no longer available. Choose a new asset or clear the field.
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base">Select Media</CardTitle>
                  <CardDescription className="text-xs">
                    Choose from the agency media library.
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Close media picker">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by filename, title, alt text, or caption"
                    className="pl-9"
                  />
                </div>
                <select
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as typeof filter)}
                >
                  <option value="all">All media</option>
                  <option value="image">Images</option>
                  <option value="document">Documents</option>
                  <option value="video">Videos</option>
                </select>
              </div>
            </CardHeader>

            <CardContent className="overflow-y-auto p-4">
              {isLoading ? (
                <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
                  Loading media library...
                </div>
              ) : assets.length ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {assets.map((asset) => {
                    const assetUrl = getAssetUrl(asset);
                    const isSelected = assetUrl === value;
                    const isImage = asset.mimeType.startsWith('image/');
                    const isVideo = asset.mimeType.startsWith('video/');

                    return (
                      <button
                        key={asset.id}
                        type="button"
                        className={`text-left rounded-lg border bg-card overflow-hidden transition-all hover:border-primary ${
                          isSelected ? 'ring-2 ring-primary border-primary' : ''
                        }`}
                        onClick={() => {
                          onChange(assetUrl || null, asset);
                          setIsOpen(false);
                        }}
                      >
                        <div className="aspect-square bg-muted/30 flex items-center justify-center overflow-hidden">
                          {isImage && assetUrl ? (
                            <img src={assetUrl} alt={asset.altText || getAssetLabel(asset)} className="h-full w-full object-cover" />
                          ) : isVideo ? (
                            <Video className="h-10 w-10 text-red-500" />
                          ) : (
                            <FileText className="h-10 w-10 text-amber-500" />
                          )}
                        </div>
                        <div className="p-2 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-xs font-semibold">{getAssetLabel(asset)}</span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                          </div>
                          <p className="truncate text-[10px] text-muted-foreground">
                            {asset.altText?.trim() || asset.originalFilename?.trim() || asset.mimeType}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
                  No media found for the current filter.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
