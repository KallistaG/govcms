'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  StatCard,
  ActivityFeed,
  QuickActionsWidget,
  LatestNewsWidget,
  RecentFilesWidget,
  RecentLoginsWidget,
} from '@govcms/ui';
import {
  FileText,
  Newspaper,
  Users,
  HardDrive,
  FileEdit,
  Globe,
} from 'lucide-react';
import {
  useDashboardStats,
  useRecentActivity,
  useLatestNews,
  useRecentLogins,
  useLatestFiles,
} from '../../../../hooks/use-dashboard';
import { useAuth } from '../../../../context/auth-context';
import {
  canCreateContent,
  canPublishContent,
  canManageUsers,
  canReadAuditLogs,
  canManageSettings,
} from '../../../../lib/admin-permissions';

export default function CMSDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: stats } = useDashboardStats();
  const { data: activities } = useRecentActivity();
  const { data: newsItems } = useLatestNews();
  const { data: recentLogins } = useRecentLogins();
  const { data: latestFiles } = useLatestFiles();

  const safeActivities = Array.isArray(activities) ? activities : [];
  const safeNewsItems = Array.isArray(newsItems) ? newsItems : [];
  const safeRecentLogins = Array.isArray(recentLogins) ? recentLogins : [];
  const safeLatestFiles = Array.isArray(latestFiles) ? latestFiles : [];

  const canCreatePage = canCreateContent(user);
  const canPublishNews = canPublishContent(user);
  const canAddUser = canManageUsers(user);
  const canViewAudit = canReadAuditLogs(user);
  const canOpenSettings = canManageSettings(user);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Total Pages"
          value={stats?.totalPages ?? 0}
          icon={FileText}
          change="+2 this week"
          changeType="positive"
          subtitle="Active page documents"
          iconBgColor="bg-blue-500/10"
          iconColor="text-blue-600 dark:text-blue-400"
        />

        <StatCard
          title="News & Releases"
          value={stats?.totalNews ?? 0}
          icon={Newspaper}
          change="+5 this month"
          changeType="positive"
          subtitle="Public announcements"
          iconBgColor="bg-amber-500/10"
          iconColor="text-amber-600 dark:text-amber-400"
        />

        <StatCard
          title="Active Users"
          value={stats?.totalUsers ?? 0}
          icon={Users}
          change="4 Roles"
          changeType="neutral"
          subtitle="Government officials"
          iconBgColor="bg-emerald-500/10"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />

        <StatCard
          title="Storage Quota"
          value={`${stats?.storage?.usedGB ?? 0} GB`}
          icon={HardDrive}
          progress={stats?.storage?.percentage ?? 0}
          iconBgColor="bg-purple-500/10"
          iconColor="text-purple-600 dark:text-purple-400"
        />

        <StatCard
          title="Draft Content"
          value={stats?.drafts ?? 0}
          icon={FileEdit}
          change="Needs Review"
          changeType="neutral"
          subtitle="Unpublished drafts"
          iconBgColor="bg-orange-500/10"
          iconColor="text-orange-600 dark:text-orange-400"
        />

        <StatCard
          title="Published Items"
          value={stats?.published ?? 0}
          icon={Globe}
          change="100% Live"
          changeType="positive"
          subtitle="Visible on public portal"
          iconBgColor="bg-teal-500/10"
          iconColor="text-teal-600 dark:text-teal-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
        <QuickActionsWidget
          canCreatePage={canCreatePage}
          canPublishNews={canPublishNews}
          canAddUser={canAddUser}
          canViewAudit={canViewAudit}
          canOpenSettings={canOpenSettings}
          onCreatePage={() => router.push('/admin/pages')}
          onPublishNews={() => router.push('/admin/news')}
          onAddUser={() => router.push('/admin/users')}
          onViewAudit={() => router.push('/admin/reports/audit-logs')}
          onOpenSettings={() => router.push('/admin/settings/general')}
        />

          <LatestNewsWidget
            newsItems={safeNewsItems}
            onViewAll={() => router.push('/admin/news')}
          />

          <RecentFilesWidget files={safeLatestFiles} />
        </div>

        <div className="space-y-6">
        <ActivityFeed activities={safeActivities} />
        {canViewAudit && <RecentLoginsWidget sessions={safeRecentLogins} />}
      </div>
    </div>
  </div>
  );
}
