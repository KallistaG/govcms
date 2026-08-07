'use client';

import * as React from 'react';
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
} from '../../../hooks/use-dashboard';

export default function CMSDashboardPage() {
  const { data: stats } = useDashboardStats();
  const { data: activities } = useRecentActivity();
  const { data: newsItems } = useLatestNews();
  const { data: recentLogins } = useRecentLogins();
  const { data: latestFiles } = useLatestFiles();

  return (
    <div className="space-y-6">
      {/* 6 Top KPI Stat Widgets */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Total Pages"
          value={stats?.totalPages ?? 14}
          icon={FileText}
          change="+2 this week"
          changeType="positive"
          subtitle="Active page documents"
          iconBgColor="bg-blue-500/10"
          iconColor="text-blue-600 dark:text-blue-400"
        />

        <StatCard
          title="News & Releases"
          value={stats?.totalNews ?? 28}
          icon={Newspaper}
          change="+5 this month"
          changeType="positive"
          subtitle="Public announcements"
          iconBgColor="bg-amber-500/10"
          iconColor="text-amber-600 dark:text-amber-400"
        />

        <StatCard
          title="Active Users"
          value={stats?.totalUsers ?? 8}
          icon={Users}
          change="4 Roles"
          changeType="neutral"
          subtitle="Government officials"
          iconBgColor="bg-emerald-500/10"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />

        <StatCard
          title="Storage Quota"
          value={`${stats?.storage?.usedGB ?? 14.2} GB`}
          icon={HardDrive}
          progress={stats?.storage?.percentage ?? 28}
          iconBgColor="bg-purple-500/10"
          iconColor="text-purple-600 dark:text-purple-400"
        />

        <StatCard
          title="Draft Content"
          value={stats?.drafts ?? 5}
          icon={FileEdit}
          change="Needs Review"
          changeType="neutral"
          subtitle="Unpublished drafts"
          iconBgColor="bg-orange-500/10"
          iconColor="text-orange-600 dark:text-orange-400"
        />

        <StatCard
          title="Published Items"
          value={stats?.published ?? 32}
          icon={Globe}
          change="100% Live"
          changeType="positive"
          subtitle="Visible on public portal"
          iconBgColor="bg-teal-500/10"
          iconColor="text-teal-600 dark:text-teal-400"
        />
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Quick Actions, Latest News, Latest Files */}
        <div className="space-y-6 lg:col-span-2">
          {/* Quick Actions Widget */}
          <QuickActionsWidget
            onCreatePage={() => alert('Navigate to Create Page Workflow')}
            onPublishNews={() => alert('Navigate to Create News Workflow')}
            onAddUser={() => alert('Navigate to User Management')}
            onViewAudit={() => alert('Navigate to System Audit Logs')}
            onOpenSettings={() => alert('Navigate to System Settings')}
          />

          {/* Latest News & Announcements Widget */}
          <LatestNewsWidget
            newsItems={newsItems ?? []}
            onViewAll={() => alert('Navigate to Content Management Directory')}
          />

          {/* Latest Uploaded Files Widget */}
          <RecentFilesWidget files={latestFiles ?? []} />
        </div>

        {/* Right Column: Recent Activity Feed & Recent Logins */}
        <div className="space-y-6">
          {/* Recent Activity Timeline Widget */}
          <ActivityFeed activities={activities ?? []} />

          {/* Recent User Logins Security Widget */}
          <RecentLoginsWidget sessions={recentLogins ?? []} />
        </div>
      </div>
    </div>
  );
}
