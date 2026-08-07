'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertOctagon, Home, RotateCcw } from 'lucide-react';

export default function WebsiteErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('Public Portal Error caught by Next.js boundary:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-xl text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20">
          <AlertOctagon className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-black text-foreground">Service Temporarily Unavailable</h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          An error occurred while loading this page on the public portal.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="px-4 py-2 rounded-xl border bg-background text-xs font-bold text-foreground hover:bg-accent transition-colors flex items-center gap-1.5"
          >
            <Home className="h-3.5 w-3.5" /> Return Home
          </Link>
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
