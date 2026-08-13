'use client';

import * as React from 'react';
import { DashboardShell } from '@govcms/ui';
import { useAuth, AuthProvider } from '../../../context/auth-context';
import { ProtectedRoute } from '../../../components/auth/protected-route';
import { ReactQueryProvider } from '../../../providers/query-provider';
import { usePathname } from 'next/navigation';
import { Toaster } from 'sonner';
import { buildAdminSidebarItems } from '../../../lib/admin-permissions';

function AdminShellContent({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const sidebarItems = React.useMemo(() => buildAdminSidebarItems(user), [user]);

  const isAuthPage = pathname === '/admin/login' || pathname === '/admin/reset-password';

  if (isAuthPage) {
    return (
      <>
        <Toaster position="top-right" richColors closeButton />
        {children}
      </>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardShell
        sidebarItems={sidebarItems}
        title="Government Portal Dashboard"
        description="System overview, live publication status, audit logs, and agency content management."
        sidebarProps={{
          currentPath: pathname || '/admin/dashboard',
        }}
        headerProps={{
          userName: user ? `${user.firstName} ${user.lastName}` : 'Official Administrator',
          userEmail: user?.email || 'admin@gov.ph',
          userRole: user?.role || 'SUPER_ADMIN',
          agencyName: user?.agency?.name || 'Department of Information & Communications Technology',
          onLogout: () => logout(),
        }}
        breadcrumbs={[
          { label: 'Admin Portal', href: '/admin/dashboard' },
          { label: 'Overview' },
        ]}
      >
        <Toaster position="top-right" richColors closeButton />
        {children}
      </DashboardShell>
    </ProtectedRoute>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <AuthProvider>
        <AdminShellContent>{children}</AdminShellContent>
      </AuthProvider>
    </ReactQueryProvider>
  );
}
