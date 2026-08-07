'use client';

import * as React from 'react';
import { MenuItemData } from '../../hooks/use-menus';
import {
  Link as LinkIcon,
  Home,
  Globe,
  Building2,
  Newspaper,
  FileText,
  Users,
  Phone,
  ShieldCheck,
  ExternalLink,
  Award,
  LayoutDashboard,
  X,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardFooter, Input, Label } from '@govcms/ui';

const ICON_OPTIONS = [
  { label: 'Link / Default', name: 'Link', Icon: LinkIcon },
  { label: 'Home Page', name: 'Home', Icon: Home },
  { label: 'Globe / Portal', name: 'Globe', Icon: Globe },
  { label: 'Agency / Building', name: 'Building2', Icon: Building2 },
  { label: 'News / Press', name: 'Newspaper', Icon: Newspaper },
  { label: 'Document / File', name: 'FileText', Icon: FileText },
  { label: 'Users / Directory', name: 'Users', Icon: Users },
  { label: 'Contact / Phone', name: 'Phone', Icon: Phone },
  { label: 'Security / Shield', name: 'ShieldCheck', Icon: ShieldCheck },
  { label: 'External Link', name: 'ExternalLink', Icon: ExternalLink },
  { label: 'Award / Mandate', name: 'Award', Icon: Award },
  { label: 'Dashboard', name: 'LayoutDashboard', Icon: LayoutDashboard },
];

interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<MenuItemData>) => Promise<void>;
  initialData?: MenuItemData | null;
  parentId?: string | null;
}

export const MenuItemModal: React.FC<MenuItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  parentId,
}) => {
  const [title, setTitle] = React.useState('');
  const [url, setUrl] = React.useState('');
  const [icon, setIcon] = React.useState('Link');
  const [isExternal, setIsExternal] = React.useState(false);
  const [openInNewTab, setOpenInNewTab] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setUrl(initialData.url);
      setIcon(initialData.icon || 'Link');
      setIsExternal(initialData.isExternal || false);
      setOpenInNewTab(initialData.openInNewTab || false);
      setIsVisible(initialData.isVisible ?? true);
    } else {
      setTitle('');
      setUrl('/');
      setIcon('Link');
      setIsExternal(false);
      setOpenInNewTab(false);
      setIsVisible(true);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        parentId,
        title,
        url,
        icon,
        isExternal: isExternal || url.startsWith('http'),
        openInNewTab,
        isVisible,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-lg shadow-2xl border bg-card">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <LinkIcon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {initialData ? 'Edit Menu Navigation Link' : 'Add New Navigation Link'}
              </CardTitle>
              <CardDescription className="text-xs">
                Configure menu title, route URL, icon, external links, and visibility.
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Navigation Link Title</Label>
            <Input
              id="title"
              placeholder="e.g. Executive Officials or Press Releases"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="url">Route Path or External Target URL</Label>
            <Input
              id="url"
              placeholder="e.g. /about/mandate or https://dict.gov.ph"
              value={url}
              onChange={(e) => {
                const val = e.target.value;
                setUrl(val);
                if (val.startsWith('http')) {
                  setIsExternal(true);
                  setOpenInNewTab(true);
                }
              }}
              required
            />
          </div>

          {/* Icon Selector */}
          <div className="space-y-1.5">
            <Label>Menu Item Icon</Label>
            <div className="grid grid-cols-4 gap-2 border rounded-lg p-2 max-h-36 overflow-y-auto bg-muted/20">
              {ICON_OPTIONS.map((item) => {
                const ItemIcon = item.Icon;
                const isSelected = icon === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    className={`flex flex-col items-center justify-center p-2 rounded-md border text-[10px] font-semibold transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-2xs font-bold'
                        : 'bg-card text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                    onClick={() => setIcon(item.name)}
                  >
                    <ItemIcon className="h-4 w-4 mb-1" />
                    <span className="truncate w-full text-center">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-bold">External Web Link</Label>
                <p className="text-[10px] text-muted-foreground">Marks item as an external portal URL</p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 rounded accent-primary"
                checked={isExternal}
                onChange={(e) => setIsExternal(e.target.checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-bold">Open in New Tab (_blank)</Label>
                <p className="text-[10px] text-muted-foreground">Launches link in new browser tab</p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 rounded accent-primary"
                checked={openInNewTab}
                onChange={(e) => setOpenInNewTab(e.target.checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-bold">Visible in Public Navigation</Label>
                <p className="text-[10px] text-muted-foreground">Uncheck to draft or hide from navigation</p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 rounded accent-primary"
                checked={isVisible}
                onChange={(e) => setIsVisible(e.target.checked)}
              />
            </div>
          </div>

          <CardFooter className="px-0 pt-4 border-t flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="font-bold">
              Save Navigation Link
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
