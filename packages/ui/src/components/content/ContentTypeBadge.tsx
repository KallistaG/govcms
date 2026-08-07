import * as React from 'react';
import { Badge } from '../ui/badge';

export interface ContentTypeBadgeProps {
  type: 'PAGE_DOCUMENT' | 'PRESS_RELEASE' | 'PUBLIC_NOTICE' | 'EVENT';
}

export const ContentTypeBadge: React.FC<ContentTypeBadgeProps> = ({ type }) => {
  switch (type) {
    case 'PAGE_DOCUMENT':
      return <Badge variant="outline" className="border-blue-500/30 text-blue-600 dark:text-blue-400">Page</Badge>;
    case 'PRESS_RELEASE':
      return <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400">News</Badge>;
    case 'PUBLIC_NOTICE':
      return <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400">Notice</Badge>;
    case 'EVENT':
      return <Badge variant="outline" className="border-purple-500/30 text-purple-600 dark:text-purple-400">Event</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};
