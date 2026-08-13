'use client';

import * as React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@govcms/ui';
import { useRouter } from 'next/navigation';

interface AdminAccessStateProps {
  title?: string;
  message?: string;
  returnHref?: string;
  returnLabel?: string;
}

export const AdminAccessState: React.FC<AdminAccessStateProps> = ({
  title = 'Access Restricted',
  message = 'You do not have permission to view this module.',
  returnHref = '/admin/dashboard',
  returnLabel = 'Return to Dashboard',
}) => {
  const router = useRouter();

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="w-full max-w-lg border-destructive/20 bg-destructive/5 shadow-none">
        <CardHeader className="text-center pb-3">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold">{title}</CardTitle>
          <CardDescription className="text-xs">{message}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pt-2">
          <Button
            variant="outline"
            className="gap-2 font-semibold"
            onClick={() => router.push(returnHref)}
          >
            <ArrowLeft className="h-4 w-4" />
            {returnLabel}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
