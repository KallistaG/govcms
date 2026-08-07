import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui/table';
import { Badge } from '../ui/badge';
import { FolderOpen, FileText, Image as ImageIcon, FileSpreadsheet, Download } from 'lucide-react';

export interface FileItem {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
  downloadUrl?: string;
}

export interface RecentFilesWidgetProps {
  files?: FileItem[];
  title?: string;
  description?: string;
}

export const RecentFilesWidget: React.FC<RecentFilesWidgetProps> = ({
  files = [],
  title = 'Latest Uploaded Files',
  description = 'Recent document uploads, executive order PDFs, and official media assets.',
}) => {
  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <ImageIcon className="h-4 w-4 text-emerald-500" />;
    if (type.includes('pdf') || type.includes('doc'))
      return <FileText className="h-4 w-4 text-primary" />;
    return <FileSpreadsheet className="h-4 w-4 text-amber-500" />;
  };

  return (
    <Card className="border-border/80">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600">
            <FolderOpen className="h-4 w-4" />
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
              <TableHead>Filename</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  No files uploaded yet.
                </TableCell>
              </TableRow>
            ) : (
              files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-semibold text-foreground flex items-center gap-2 max-w-[200px] truncate">
                    {getFileIcon(file.type)}
                    <span className="truncate">{file.name}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{file.uploadedBy}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {file.size}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-colors"
                      title="Download File"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
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
