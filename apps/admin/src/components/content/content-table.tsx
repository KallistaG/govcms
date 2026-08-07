'use client';

import * as React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import { ContentItem } from '../../hooks/use-content';
import {
  Search,
  Plus,
  Trash2,
  Globe,
  Archive,
  ArrowUpDown,
  Edit,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Building2,
  FileText,
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
  ContentStatusBadge,
  ContentTypeBadge,
  Checkbox,
} from '@govcms/ui';

interface ContentTableProps {
  data: ContentItem[];
  meta?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
  isLoading?: boolean;
  onSearchChange: (search: string) => void;
  onStatusFilterChange: (status: string) => void;
  onTypeFilterChange: (type: string) => void;
  onPageChange: (page: number) => void;
  onEditItem: (item: ContentItem) => void;
  onDeleteItem: (id: string) => void;
  onBulkAction: (action: 'delete' | 'publish' | 'archive', ids: string[]) => void;
  onCreateNew: () => void;
  selectedStatus?: string;
  selectedType?: string;
}

export const ContentTable: React.FC<ContentTableProps> = ({
  data,
  meta,
  isLoading,
  onSearchChange,
  onStatusFilterChange,
  onTypeFilterChange,
  onPageChange,
  onEditItem,
  onDeleteItem,
  onBulkAction,
  onCreateNew,
  selectedStatus = '',
  selectedType = '',
}) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
  const [searchInput, setSearchInput] = React.useState('');

  const columns: ColumnDef<ContentItem>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all rows"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="font-bold -ml-3"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Title & Details <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-bold text-foreground text-sm hover:text-primary transition-colors cursor-pointer" onClick={() => onEditItem(item)}>
              {item.title}
            </span>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>{item.authorName}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" /> {item.agencyName}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <ContentTypeBadge type={row.original.type} />,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <ContentStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'updatedAt',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="font-bold -ml-3"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Last Updated <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
          <Calendar className="h-3 w-3" />
          {new Date(row.original.updatedAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-1 justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs font-semibold"
              onClick={() => onEditItem(item)}
            >
              <Edit className="h-3.5 w-3.5 mr-1" /> Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
              onClick={() => onDeleteItem(item.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedIds = selectedRows.map((r) => r.original.id);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchInput);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-card p-4 rounded-xl border shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search content title, summary or text..."
              className="pl-9 text-xs"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="font-semibold">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Tabs */}
          <div className="flex items-center rounded-lg border bg-muted/40 p-1 text-xs">
            <button
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                selectedStatus === '' ? 'bg-background shadow-2xs font-bold text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => onStatusFilterChange('')}
            >
              All Status
            </button>
            <button
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                selectedStatus === 'PUBLISHED' ? 'bg-background shadow-2xs font-bold text-emerald-600' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => onStatusFilterChange('PUBLISHED')}
            >
              Published
            </button>
            <button
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                selectedStatus === 'DRAFT' ? 'bg-background shadow-2xs font-bold text-amber-600' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => onStatusFilterChange('DRAFT')}
            >
              Draft
            </button>
            <button
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                selectedStatus === 'ARCHIVED' ? 'bg-background shadow-2xs font-bold text-rose-600' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => onStatusFilterChange('ARCHIVED')}
            >
              Archived
            </button>
          </div>

          {/* Type Filter Select */}
          <select
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={selectedType}
            onChange={(e) => onTypeFilterChange(e.target.value)}
          >
            <option value="">All Content Types</option>
            <option value="PAGE_DOCUMENT">Pages</option>
            <option value="PRESS_RELEASE">News</option>
            <option value="PUBLIC_NOTICE">Announcements</option>
            <option value="EVENT">Events</option>
          </select>

          <Button onClick={onCreateNew} size="sm" className="font-bold gap-1 shadow-xs">
            <Plus className="h-4 w-4" /> New Content
          </Button>
        </div>
      </div>

      {/* Floating Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg animate-in fade-in-50">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="font-bold">
              {selectedIds.length} Selected
            </Badge>
            <span className="text-xs text-muted-foreground font-medium">
              Apply batch action across selected items
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-semibold gap-1 text-emerald-600 border-emerald-600/30 hover:bg-emerald-50 dark:hover:bg-emerald-950"
              onClick={() => {
                onBulkAction('publish', selectedIds);
                table.toggleAllPageRowsSelected(false);
              }}
            >
              <Globe className="h-3.5 w-3.5" /> Bulk Publish
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-semibold gap-1 text-amber-600 border-amber-600/30 hover:bg-amber-50 dark:hover:bg-amber-950"
              onClick={() => {
                onBulkAction('archive', selectedIds);
                table.toggleAllPageRowsSelected(false);
              }}
            >
              <Archive className="h-3.5 w-3.5" /> Bulk Archive
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-8 text-xs font-semibold gap-1"
              onClick={() => {
                onBulkAction('delete', selectedIds);
                table.toggleAllPageRowsSelected(false);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Bulk Delete
            </Button>
          </div>
        </div>
      )}

      {/* TanStack Data Table */}
      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/40">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground text-xs">
                  Loading government content items...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <FileText className="h-8 w-8 text-muted-foreground/40" />
                    <span className="text-xs font-semibold">No content items found matching current filters.</span>
                    <Button variant="outline" size="sm" onClick={onCreateNew}>
                      Create First Document
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          Showing page <span className="font-bold font-mono text-foreground">{meta?.currentPage || 1}</span> of{' '}
          <span className="font-bold font-mono text-foreground">{meta?.totalPages || 1}</span> ({meta?.totalItems || data.length} items total)
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={(meta?.currentPage || 1) <= 1}
            onClick={() => onPageChange((meta?.currentPage || 1) - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={(meta?.currentPage || 1) >= (meta?.totalPages || 1)}
            onClick={() => onPageChange((meta?.currentPage || 1) + 1)}
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};
