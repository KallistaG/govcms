import * as React from 'react';
import {
  LayoutDashboard,
  FileText,
  FileSpreadsheet,
  Users,
  Building,
  ShieldAlert,
  Settings,
  ChevronLeft,
  ChevronRight,
  Globe,
  Award,
  Layers,
  Activity,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  roles?: string[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface SidebarProps {
  currentPath?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const defaultNavGroups: NavGroup[] = [
  {
    title: 'Core Platform',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { title: 'Public Services', href: '/services', icon: Globe, badge: 'Active' },
    ],
  },
  {
    title: 'Content Management',
    items: [
      { title: 'Press Releases', href: '/content/press-releases', icon: FileText },
      { title: 'Public Notices', href: '/content/notices', icon: FileSpreadsheet },
      { title: 'Executive Orders', href: '/content/executive-orders', icon: Award },
      { title: 'Government Pages', href: '/content/pages', icon: Layers },
    ],
  },
  {
    title: 'Agency Governance',
    items: [
      { title: 'Agencies Directory', href: '/governance/agencies', icon: Building },
      { title: 'Users & Roles', href: '/governance/users', icon: Users },
      { title: 'Audit Trail', href: '/governance/audit-logs', icon: Activity },
    ],
  },
  {
    title: 'System Administration',
    items: [
      { title: 'Security & Compliance', href: '/admin/security', icon: ShieldAlert },
      { title: 'System Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath = '/dashboard',
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-card border-r transition-all duration-300">
      {/* Top Branding Section */}
      <div>
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black shadow-md">
              <span className="text-secondary text-lg">G</span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-extrabold tracking-tight text-foreground">
                  GovCMS <span className="text-secondary text-xs font-semibold">HQ</span>
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Enterprise Platform
                </span>
              </div>
            )}
          </div>
          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Sections */}
        <nav className="space-y-6 px-3 py-4 overflow-y-auto max-h-[calc(100vh-140px)]">
          {defaultNavGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {!isCollapsed && (
                <h4 className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
                  {group.title}
                </h4>
              )}
              <ul className="space-y-1">
                {group.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.href;
                  return (
                    <li key={itemIdx}>
                      <a
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-all group relative',
                          isActive
                            ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                          isCollapsed && 'justify-center px-2',
                        )}
                        title={isCollapsed ? item.title : undefined}
                      >
                        <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-secondary' : 'text-muted-foreground group-hover:text-foreground')} />
                        {!isCollapsed && (
                          <span className="flex-1 truncate">{item.title}</span>
                        )}
                        {!isCollapsed && item.badge && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-bold">
                            {item.badge}
                          </Badge>
                        )}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer & Collapse Toggle */}
      <div className="border-t p-3 space-y-3 bg-muted/20">
        {!isCollapsed && (
          <div className="rounded-md border bg-background p-2.5 shadow-2xs text-[11px]">
            <div className="flex items-center justify-between text-muted-foreground font-medium">
              <span>Security Status</span>
              <span className="text-emerald-600 font-bold">ISO 27001</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Government Standard Encryption Enabled
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <span className="text-[10px] text-muted-foreground font-mono">
              GovCMS v1.0.0
            </span>
          )}
          {onToggleCollapse && (
            <Button
              variant="outline"
              size="icon"
              className={cn('h-7 w-7 hidden lg:flex', isCollapsed && 'mx-auto')}
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Permanent Sidebar */}
      <aside
        className={cn(
          'hidden lg:block h-screen sticky top-0 z-20 shrink-0 border-r transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64',
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer content */}
          <div className="relative flex w-72 max-w-[80vw] flex-col z-10 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
