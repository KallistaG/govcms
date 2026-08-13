import * as React from 'react';
import { Badge } from '../ui/badge';

export interface ContentStatusBadgeProps {
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
}

export const ContentStatusBadge: React.FC<ContentStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'PUBLISHED':
      return <Badge variant="success">Published</Badge>;
    case 'APPROVED':
      return <Badge variant="secondary">Approved</Badge>;
    case 'PENDING_REVIEW':
      return <Badge variant="warning">In Review</Badge>;
    case 'DRAFT':
      return <Badge variant="outline">Draft</Badge>;
    case 'ARCHIVED':
      return <Badge variant="destructive">Archived</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};
