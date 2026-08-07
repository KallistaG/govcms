'use client';

import * as React from 'react';
import { DashboardShell } from '@govcms/ui';
import { useAuth } from '../../context/auth-context';
import { ProtectedRoute } from '../../components/auth/protected-route';
import { usePathname } from 'next/navigation';
import { Toaster } from 'sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <ProtectedRoute>
      <DashboardShell
        title="Government Portal Dashboard"
        description="System overview, live publication status, audit logs, and agency content management."
        sidebarProps={{
          currentPath: pathname || '/dashboard',
        }}
        headerProps={{
          userName: user ? `${user.firstName} ${user.lastName}` : 'Official Administrator',
          userEmail: user?.email || 'admin@gov.ph',
          userRole: user?.role || 'SUPER_ADMIN',
          agencyName: user?.agency?.name || 'Department of Information & Communications Technology',
          onLogout: () => logout(),
        }}
        breadcrumbs={[
          { label: 'Admin Portal', href: '/dashboard' },
          { label: 'Overview' },
        ]}
      >
        <Toaster position="top-right" richColors closeButton />
        {children}
      </DashboardShell>
    </ProtectedRoute>
  );
}
