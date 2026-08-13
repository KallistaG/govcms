'use client';

import * as React from 'react';
import {
  useAuditLogs,
  downloadAuditLogsCsv,
  AuditLogData,
} from '../../../../../hooks/use-audit-logs';
import {
  ShieldAlert,
  Search,
  Download,
} from 'lucide-react';
import {
  Button,
  Input,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@govcms/ui';
import { useAuth } from '../../../../../context/auth-context';
import { AdminAccessState } from '../../../../../components/auth/admin-access-state';
import { canReadAuditLogs } from '../../../../../lib/admin-permissions';

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [search, setSearch] = React.useState('');
  const [actionFilter, setActionFilter] = React.useState('ALL');
  const [entityFilter, setEntityFilter] = React.useState('ALL');

  const { data: logs = [], isLoading } = useAuditLogs(search, actionFilter, entityFilter);

  if (!canReadAuditLogs(user)) {
    return (
      <AdminAccessState
        title="Audit logs restricted"
        message="You do not have permission to view the system audit trail."
      />
    );
  }

  const handleExportCsv = () => {
    downloadAuditLogsCsv(logs);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'PUBLISH':
        return <Badge className="bg-emerald-600 text-white font-bold text-[10px]">PUBLISH</Badge>;
      case 'CREATE':
        return <Badge className="bg-blue-600 text-white font-bold text-[10px]">CREATE</Badge>;
      case 'EDIT':
        return <Badge className="bg-amber-600 text-white font-bold text-[10px]">EDIT</Badge>;
      case 'DELETE':
        return <Badge className="bg-red-600 text-white font-bold text-[10px]">DELETE</Badge>;
      case 'LOGIN':
        return <Badge variant="outline" className="text-purple-600 border-purple-500/30 font-bold text-[10px]">LOGIN</Badge>;
      case 'ARCHIVE':
        return <Badge variant="secondary" className="font-bold text-[10px]">ARCHIVE</Badge>;
      default:
        return <Badge variant="outline" className="font-bold text-[10px]">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-primary" /> System Security Audit Trail Logs
          </h1>
          <p className="text-xs text-muted-foreground">
            Immutable security log registry tracking staff login sessions, content publications, and administrative mutations.
          </p>
        </div>

        <Button onClick={handleExportCsv} variant="outline" className="font-bold gap-1 shadow-xs text-xs">
          <Download className="h-4 w-4" /> Export CSV Log Report
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter audit logs by action, IP address, user email..."
              className="pl-9 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-semibold"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="ALL">All Log Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="PUBLISH">PUBLISH</option>
            <option value="CREATE">CREATE</option>
            <option value="EDIT">EDIT</option>
            <option value="DELETE">DELETE</option>
            <option value="ARCHIVE">ARCHIVE</option>
          </select>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Staff User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity Type</TableHead>
              <TableHead>Terminal / IP Address</TableHead>
              <TableHead>Device & Browser</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-xs text-muted-foreground">
                  Loading audit trail logs...
                </TableCell>
              </TableRow>
            ) : logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs font-mono font-semibold">
                  {new Date(log.createdAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-xs">
                      {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System / Anonymous'}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">{log.user?.email || 'N/A'}</span>
                  </div>
                </TableCell>
                <TableCell>{getActionBadge(log.action)}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px] font-mono">{log.entityType}</Badge></TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">{log.ipAddress || '127.0.0.1'}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{log.browser || 'Chrome 120'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
