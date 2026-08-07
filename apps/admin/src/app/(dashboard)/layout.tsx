'use client';

import * as React from 'react';
import { DashboardShell } from '@govcms/ui';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      title="Government Portal Dashboard"
      description="System overview, live publication status, audit logs, and agency content management."
      headerProps={{
        userName: 'Official Administrator',
        userEmail: 'admin@dict.gov.ph',
        userRole: 'SUPER_ADMIN',
        agencyName: 'Department of Information & Communications Technology',
      }}
      breadcrumbs={[
        { label: 'Admin Portal', href: '/dashboard' },
        { label: 'Overview' },
      ]}
    >
      {children}
    </DashboardShell>
  );
}
