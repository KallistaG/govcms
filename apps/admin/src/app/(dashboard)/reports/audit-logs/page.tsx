'use client';

import * as React from 'react';
import {
  useAuditLogs,
  downloadAuditLogsCsv,
  AuditLogData,
} from '../../../../hooks/use-audit-logs';
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

export default function AuditLogsPage() {
  const [search, setSearch] = React.useState('');
  const [actionFilter, setActionFilter] = React.useState('ALL');
  const [entityFilter, setEntityFilter] = React.useState('ALL');

  const { data: logs = [], isLoading } = useAuditLogs(search, actionFilter, entityFilter);

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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-primary" /> System Audit Trail & Telemetry
          </h1>
          <p className="text-xs text-muted-foreground">
            Complete security audit logs tracking user logins, content mutations, publishing events, and IP telemetry.
          </p>
        </div>

        <Button onClick={handleExportCsv} className="font-bold gap-1 shadow-xs" disabled={logs.length === 0}>
          <Download className="h-4 w-4" /> Export CSV Report
        </Button>
      </div>

      {/* Action & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card p-4 rounded-xl border shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by action, user email, entity or IP address..."
            className="pl-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action Filter */}
          <select
            className="border rounded-lg px-3 py-2 text-xs bg-background font-medium"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="ALL">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="CREATE">CREATE</option>
            <option value="EDIT">EDIT</option>
            <option value="DELETE">DELETE</option>
            <option value="PUBLISH">PUBLISH</option>
            <option value="ARCHIVE">ARCHIVE</option>
          </select>

          {/* Entity Type Filter */}
          <select
            className="border rounded-lg px-3 py-2 text-xs bg-background font-medium"
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
          >
            <option value="ALL">All Entity Types</option>
            <option value="ContentItem">ContentItem</option>
            <option value="MediaAsset">MediaAsset</option>
            <option value="Menu">Menu</option>
            <option value="User">User</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>User / Actor</TableHead>
              <TableHead>Target Entity</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Browser / Device</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                  Loading system audit trail logs...
                </TableCell>
              </TableRow>
            ) : logs.length > 0 ? (
              logs.map((log: AuditLogData) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{getActionBadge(log.action)}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-foreground">
                        {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System / Anon'}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate">
                        {log.user?.email || 'API Execution'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      <span className="font-semibold text-foreground">{log.entityType}</span>
                      {log.entityId && (
                        <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                          ({log.entityId})
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.ipAddress || '127.0.0.1'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-[11px]">
                      <span className="font-semibold text-foreground">{log.browser || 'Chrome 120'}</span>
                      <span className="text-[10px] text-muted-foreground">{log.device || 'Desktop (Windows)'}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                  No audit logs match your search filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
