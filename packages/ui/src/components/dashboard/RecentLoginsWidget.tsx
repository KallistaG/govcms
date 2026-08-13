import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/table';
import { Badge } from '../ui/badge';
import { KeyRound } from 'lucide-react';

export interface LoginSessionItem {
  id: string;
  userEmail?: string | null;
  role?: string | null;
  ipAddress?: string | null;
  timestamp?: string | Date | null;
  status?: 'SUCCESS' | 'FAILED' | string | null;
}

export interface RecentLoginsWidgetProps {
  sessions?: LoginSessionItem[];
  title?: string;
  description?: string;
}

export const RecentLoginsWidget: React.FC<RecentLoginsWidgetProps> = ({
  sessions = [],
  title = 'Recent User Logins',
  description = 'Security audit log of recent user access attempts.',
}) => {
  const formatTimestamp = (value?: string | Date | null) => {
    if (!value) return 'Unknown time';

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown time';

    return date.toLocaleString();
  };

  return (
    <Card className="border-border/80">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-600">
            <KeyRound className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead className="text-right">Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  No login history recorded.
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-semibold text-foreground truncate max-w-[150px]">
                    {session.userEmail?.trim() || 'Unknown user'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {session.role?.trim() || 'Unknown role'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground text-[11px]">
                    {session.ipAddress?.trim() || 'Unknown IP'}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground font-mono text-[11px]">
                    {formatTimestamp(session.timestamp)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
