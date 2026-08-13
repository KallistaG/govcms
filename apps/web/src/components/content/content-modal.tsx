'use client';

import * as React from 'react';
import { ContentItem } from '../../hooks/use-content';
import { FileText, Loader2, X } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  Input,
  Label,
  TipTapEditor,
} from '@govcms/ui';
import { MediaPicker } from '../media/media-picker';

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ContentItem>) => Promise<void>;
  initialData?: ContentItem | null;
  defaultType?: string;
  canPublishContent?: boolean;
}

export const ContentModal: React.FC<ContentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  defaultType = 'PAGE_DOCUMENT',
  canPublishContent = true,
}) => {
  const [title, setTitle] = React.useState('');
  const [summary, setSummary] = React.useState('');
  const [body, setBody] = React.useState('');
  const [featuredImage, setFeaturedImage] = React.useState('');
  const [type, setType] = React.useState<ContentItem['type']>(
    (defaultType as ContentItem['type']) || 'PAGE_DOCUMENT',
  );
  const [status, setStatus] = React.useState<ContentItem['status']>('DRAFT');
  const [eventDate, setEventDate] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const statusOptions = React.useMemo(() => {
    const options = [
      { value: 'DRAFT', label: 'Draft' },
      { value: 'PENDING_REVIEW', label: 'In Review' },
      { value: 'ARCHIVED', label: 'Archived' },
    ];

    if (canPublishContent) {
      options.splice(2, 0, { value: 'PUBLISHED', label: 'Published' });
    } else if (status === 'PUBLISHED') {
      options.splice(2, 0, { value: 'PUBLISHED', label: 'Published (read only)' });
    }

    if (status === 'APPROVED') {
      options.splice(2, 0, { value: 'APPROVED', label: 'Approved' });
    }

    return options;
  }, [canPublishContent, status]);

  React.useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setSummary(initialData.summary || '');
      setBody(initialData.body);
      setFeaturedImage(initialData.featuredImage || '');
      setType(initialData.type);
      setStatus(initialData.status);
      setEventDate(initialData.eventDate || '');
      setLocation(initialData.location || '');
    } else {
      setTitle('');
      setSummary('');
      setBody('');
      setFeaturedImage('');
      setType((defaultType as ContentItem['type']) || 'PAGE_DOCUMENT');
      setStatus('DRAFT');
      setEventDate('');
      setLocation('');
    }
  }, [initialData, defaultType, isOpen]);

  if (!isOpen) return null;

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        summary,
        body,
        featuredImage: featuredImage || null,
        type,
        status,
        eventDate: type === 'EVENT' && eventDate ? eventDate : undefined,
        location: type === 'EVENT' && location ? location : undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitLabel =
    status === 'PUBLISHED'
      ? 'Publish Content Document'
      : status === 'PENDING_REVIEW'
      ? 'Submit for Review'
      : 'Save Draft';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-4xl shadow-2xl border bg-card max-h-[92vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {initialData ? 'Edit Content Document' : 'Create New Content Document'}
              </CardTitle>
              <CardDescription className="text-xs">
                Author official government pages, press releases, notices, or events with TipTap Rich Text Editor.
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="title">Document Title</Label>
              <Input
                id="title"
                placeholder="e.g. Executive Order No. 44 Digital Strategy"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="type">Content Type</Label>
              <select
                id="type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={type}
                onChange={(e) => setType(e.target.value as ContentItem['type'])}
              >
                <option value="PAGE_DOCUMENT">Static Government Page</option>
                <option value="PRESS_RELEASE">News & Press Release</option>
                <option value="PUBLIC_NOTICE">Public Announcement / Notice</option>
                <option value="EVENT">Government Event</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status">Initial Publication Status</Label>
              <select
                id="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={status}
                onChange={(e) => setStatus(e.target.value as ContentItem['status'])}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value} disabled={option.value === 'PUBLISHED' && !canPublishContent}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {type === 'EVENT' && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="eventDate">Event Date & Time</Label>
                  <Input
                    id="eventDate"
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="location">Event Location / Virtual Link</Label>
                  <Input
                    id="location"
                    placeholder="e.g. DICT Executive Hall / Zoom Link"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="summary">Executive Summary (Optional)</Label>
              <Input
                id="summary"
                placeholder="Brief 1-2 sentence overview for news feeds and search engine indexing"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>Document Body (TipTap Rich Text Editor)</Label>
              <TipTapEditor
                content={body}
                onChange={(html) => setBody(html)}
                onAutoSave={async (html) => {
                  setBody(html);
                }}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <MediaPicker
                label="Featured Image"
                placeholder="Choose a featured image for content cards and social previews"
                value={featuredImage || null}
                onChange={(url) => setFeaturedImage(url || '')}
                mimeType="image"
              />
              {featuredImage && (
                <div className="rounded-lg border bg-muted/20 overflow-hidden">
                  <img
                    src={featuredImage}
                    alt="Featured image preview"
                    className="h-44 w-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          <CardFooter className="px-0 pt-4 border-t flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="font-bold" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Document...
                </>
              ) : (
                submitLabel
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
