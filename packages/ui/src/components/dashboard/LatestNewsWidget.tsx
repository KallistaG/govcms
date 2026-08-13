import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/table';
import { Badge } from '../ui/badge';
import { Newspaper, ExternalLink } from 'lucide-react';

export interface NewsItem {
  id: string;
  title?: string | null;
  category?: string | null;
  authorName?: string | null;
  status?: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED' | null;
  publishedAt?: string | Date | null;
}

export interface LatestNewsWidgetProps {
  newsItems?: NewsItem[];
  title?: string;
  description?: string;
  onViewAll?: () => void;
}

export const LatestNewsWidget: React.FC<LatestNewsWidgetProps> = ({
  newsItems = [],
  title = 'Latest Government News & Press Releases',
  description = 'Recent public announcements and official press releases.',
  onViewAll,
}) => {
  const getStatusBadge = (status?: string | null) => {
    switch (status || 'DRAFT') {
      case 'PUBLISHED':
        return <Badge variant="success">Published</Badge>;
      case 'APPROVED':
        return <Badge variant="secondary">Approved</Badge>;
      case 'PENDING_REVIEW':
        return <Badge variant="warning">Under Review</Badge>;
      case 'DRAFT':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  const formatDate = (value?: string | Date | null) => {
    if (!value) return 'N/A';

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';

    return date.toLocaleDateString();
  };

  return (
    <Card className="border-border/80">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary/20 text-secondary-foreground">
            <Newspaper className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
          >
            View All <ExternalLink className="h-3 w-3" />
          </button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Article Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Author</TableHead>
              <TableHead className="text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {newsItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  No news items available.
                </TableCell>
              </TableRow>
            ) : (
              newsItems.map((item) => {
                const title = item.title?.trim() || 'Untitled item';
                const category = item.category?.trim() || 'Uncategorized';
                const authorName = item.authorName?.trim() || 'Unknown user';
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold text-foreground max-w-[200px] truncate sm:max-w-[300px]">
                      {title}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{category}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-muted-foreground text-[11px]">
                      <span className="block truncate">By {authorName}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {formatDate(item.publishedAt)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
