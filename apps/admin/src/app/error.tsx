'use client';

import * as React from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@govcms/ui';

export default function AdminErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('Admin System Error caught by Next.js boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-lg shadow-xl border bg-card text-center">
        <CardHeader className="space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20">
            <AlertOctagon className="h-7 w-7" />
          </div>
          <CardTitle className="text-xl font-black text-foreground">
            System Execution Error
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            An unhandled runtime exception occurred while processing your admin request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-3 rounded-xl bg-muted/40 border font-mono text-[11px] text-destructive/90 text-left overflow-x-auto max-h-32">
            {error.message || 'Unknown runtime error.'}
          </div>
        </CardContent>
        <CardFooter className="justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => (window.location.href = '/dashboard')}
            className="font-semibold gap-1.5"
          >
            <Home className="h-3.5 w-3.5" /> Return to Dashboard
          </Button>
          <Button size="sm" onClick={() => reset()} className="font-bold gap-1.5 shadow-xs">
            <RotateCcw className="h-3.5 w-3.5" /> Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
