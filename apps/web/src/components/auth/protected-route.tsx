'use client';

import * as React from 'react';
import { useAuth } from '../../context/auth-context';
import { useRouter } from 'next/navigation';
import { UserRole } from '../../types/auth';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { Button } from '@govcms/ui';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Verifying Government Credentials...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (
    allowedRoles &&
    allowedRoles.length > 0 &&
    user &&
    user.role !== 'SUPER_ADMIN' &&
    !allowedRoles.includes(user.role)
  ) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
        <p className="mt-2 max-w-md text-xs text-muted-foreground">
          Your account role (<span className="font-mono font-bold text-foreground">{user.role}</span>) does not possess sufficient privileges to view this module. Required role: {allowedRoles.join(', ')}.
        </p>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
