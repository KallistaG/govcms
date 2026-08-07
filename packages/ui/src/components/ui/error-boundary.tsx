'use client';

import * as React from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import { Button } from './button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled React Error Boundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="region"
          aria-label="Error Alert Boundary"
          className="min-h-[250px] flex items-center justify-center p-6 bg-card rounded-2xl border shadow-xs"
        >
          <Card className="w-full max-w-md border-destructive/30 bg-destructive/5 shadow-none">
            <CardHeader className="text-center pb-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-2">
                <AlertOctagon className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg text-foreground font-bold">
                {this.props.fallbackTitle || 'Component Error Occurred'}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {this.props.fallbackDescription ||
                  'An unexpected runtime error occurred while rendering this module.'}
              </CardDescription>
            </CardHeader>
            {this.state.error && (
              <CardContent className="pb-4">
                <pre className="text-[10px] font-mono p-3 rounded-lg bg-background border text-destructive/90 overflow-x-auto max-h-28">
                  {this.state.error.message}
                </pre>
              </CardContent>
            )}
            <CardFooter className="justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReset}
                className="font-bold text-xs gap-1.5 focus-visible:ring-2 focus-visible:ring-primary"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reload Module
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
