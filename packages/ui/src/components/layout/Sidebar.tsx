import * as React from 'react';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Menu as MenuIcon,
  Users as UsersIcon,
  Settings,
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Building2,
  Newspaper,
  Award,
  Layers,
  FileSpreadsheet,
  UploadCloud,
  FolderKanban,
  Link,
  ShieldCheck,
  Activity,
  Sparkles,
  HardDrive,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export interface SubMenuItem {
  title: string;
  href: string;
  badge?: string;
}

export interface MenuItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: SubMenuItem[];
}

const defaultMenuTree: MenuItem[] = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Page Builder',
    icon: Sparkles,
    badge: 'New',
    children: [
      { title: 'Homepage Builder', href: '/admin/page-builder/homepage' },
      { title: 'Custom Pages', href: '/admin/pages' },
    ],
  },
  {
    title: 'Content',
    href: '/admin/news',
    icon: FileText,
    badge: 'CMS',
    children: [
      { title: 'All Content Items', href: '/admin/news' },
    ],
  },
  {
    title: 'Media Library',
    href: '/admin/media',
    icon: FolderOpen,
    children: [
      { title: 'Media Asset Library', href: '/admin/media' },
    ],
  },
  {
    title: 'Menu Builder',
    href: '/admin/menus',
    icon: MenuIcon,
    children: [
      { title: 'Navigation Menus', href: '/admin/menus' },
    ],
  },
  {
    title: 'Users & Access',
    href: '/admin/users',
    icon: UsersIcon,
    children: [
      { title: 'User Management', href: '/admin/users' },
    ],
  },
  {
    title: 'Settings & Theme',
    icon: Settings,
    children: [
      { title: 'Website Settings', href: '/admin/settings/general' },
      { title: 'Theme Manager', href: '/admin/settings/theme' },
    ],
  },
  {
    title: 'Reports & Logs',
    icon: BarChart3,
    children: [
      { title: 'Audit Trail Logs', href: '/admin/reports/audit-logs' },
    ],
  },
];

export interface SidebarProps {
  currentPath?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  items?: MenuItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath = '/dashboard',
  isCollapsed: externalIsCollapsed,
  onToggleCollapse: externalOnToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
  items,
}) => {
  const navigationItems = items?.length ? items : defaultMenuTree;

  // Local state persistence for collapsed state if external handlers not passed
  const [internalCollapsed, setInternalCollapsed] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('govcms_sidebar_collapsed') === 'true';
  });

  const isCollapsed = externalIsCollapsed ?? internalCollapsed;

  const handleToggle = () => {
    const nextState = !isCollapsed;
    if (typeof window !== 'undefined') {
      localStorage.setItem('govcms_sidebar_collapsed', String(nextState));
    }
    if (externalOnToggleCollapse) {
      externalOnToggleCollapse();
    } else {
      setInternalCollapsed(nextState);
    }
  };

  // Open state for accordion menus
  const [openMenus, setOpenMenus] = React.useState<Record<string, boolean>>({
    Dashboard: true,
    'Page Builder': true,
    Content: true,
    'Media Library': true,
    'Menu Builder': true,
    'Users & Access': true,
    'Settings & Theme': true,
    'Reports & Logs': true,
  });

  const toggleSubMenu = (title: string) => {
    setOpenMenus((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const renderNavItems = (inDrawer = false) => (
    <TooltipProvider delayDuration={100}>
      <div className="space-y-1 px-2.5 py-3">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          const isOpen = !!openMenus[item.title];

          const isChildActive =
            hasChildren && item.children?.some((child) => child.href === currentPath);
          const isMainActive = item.href === currentPath || isChildActive;

          // Collapsed Mode Item View
          if (isCollapsed && !inDrawer) {
            return (
              <Tooltip key={item.title}>
                <TooltipTrigger asChild>
                  <a
                    href={item.href || item.children?.[0]?.href || '#'}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg transition-all mx-auto relative group',
                      isMainActive
                        ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.badge && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary text-secondary-foreground text-[9px] font-bold px-1 ring-2 ring-background">
                        {item.badge}
                      </span>
                    )}
                  </a>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10} className="space-y-1">
                  <p className="font-bold">{item.title}</p>
                  {hasChildren && (
                    <div className="pt-1 border-t border-border/50 text-[11px] space-y-0.5 font-normal">
                      {item.children?.map((child) => (
                        <p key={child.title} className="text-muted-foreground hover:text-foreground">
                          • {child.title}
                        </p>
                      ))}
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          }

          // Expanded / Drawer Item View
          if (hasChildren) {
            return (
              <Collapsible key={item.title} open={isOpen} onOpenChange={() => toggleSubMenu(item.title)}>
                <CollapsibleTrigger asChild>
                  <button
                    className={cn(
                      'flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-semibold transition-all group',
                      isMainActive
                        ? 'text-primary bg-primary/10 font-bold'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={cn('h-4 w-4 shrink-0', isMainActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                      <span>{item.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-bold">
                          {item.badge}
                        </Badge>
                      )}
                      <ChevronDown
                        className={cn(
                          'h-3.5 w-3.5 text-muted-foreground/70 transition-transform duration-200',
                          isOpen && 'rotate-180',
                        )}
                      />
                    </div>
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent className="pl-6 pt-1 space-y-1">
                  {item.children?.map((child) => {
                    const isSubActive = currentPath === child.href;
                    return (
                      <a
                        key={child.title}
                        href={child.href}
                        className={cn(
                          'flex items-center justify-between rounded-md px-3 py-1.5 text-[11px] font-medium transition-all relative border-l pl-3',
                          isSubActive
                            ? 'text-primary font-bold border-primary bg-primary/5'
                            : 'text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground',
                        )}
                      >
                        <span className="truncate">{child.title}</span>
                        {child.badge && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
                            {child.badge}
                          </Badge>
                        )}
                      </a>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          }

          // Single Item View
          return (
            <a
              key={item.title}
              href={item.href || '#'}
              className={cn(
                'flex items-center justify-between rounded-md px-3 py-2 text-xs font-semibold transition-all group',
                isMainActive
                  ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={cn('h-4 w-4 shrink-0', isMainActive ? 'text-secondary' : 'text-muted-foreground group-hover:text-foreground')} />
                <span>{item.title}</span>
              </div>
              {item.badge && (
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-bold">
                  {item.badge}
                </Badge>
              )}
            </a>
          );
        })}
      </div>
    </TooltipProvider>
  );

  const sidebarHeader = (
    <div className="flex h-16 items-center justify-between px-3 border-b bg-card">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black shadow-sm">
          <Building2 className="h-5 w-5 text-secondary" />
        </div>
        {(!isCollapsed || isMobileOpen) && (
          <div className="flex flex-col truncate">
            <span className="text-sm font-black tracking-tight text-foreground flex items-center gap-1.5">
              GovCMS <Badge variant="outline" className="text-[9px] py-0 h-3.5 font-mono">v1.0</Badge>
            </span>
            <span className="text-[10px] text-muted-foreground font-mono truncate">
              DICT Portal Engine
            </span>
          </div>
        )}
      </div>

      {isMobileOpen && (
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onCloseMobile}>
          <X className="h-5 w-5" />
        </Button>
      )}
    </div>
  );

  const sidebarFooter = (
    <div className="border-t p-3 space-y-2 bg-muted/20">
      {(!isCollapsed || isMobileOpen) && (
        <div className="rounded-md border bg-card p-2.5 text-[11px] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground font-semibold">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Security ISO
            </span>
            <span className="text-emerald-600 font-bold font-mono">27001</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Encrypted Agency Operations
          </p>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        {(!isCollapsed || isMobileOpen) && (
          <span className="text-[10px] text-muted-foreground font-mono">
            Press <kbd className="px-1 py-0.5 rounded border bg-muted font-sans text-[9px]">Ctrl+B</kbd>
          </span>
        )}
        <Button
          variant="outline"
          size="icon"
          className={cn('h-7 w-7 hidden lg:flex', isCollapsed && 'mx-auto')}
          onClick={handleToggle}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Permanent Collapsible Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex h-screen sticky top-0 z-20 shrink-0 flex-col justify-between border-r bg-card transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-64',
        )}
      >
        <div>
          {sidebarHeader}
          <div className="overflow-y-auto max-h-[calc(100vh-140px)]">
            {renderNavItems(false)}
          </div>
        </div>
        {sidebarFooter}
      </aside>

      {/* Mobile Responsive Sheet Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex w-72 max-w-[85vw] flex-col justify-between z-10 bg-card border-r shadow-2xl">
            <div>
              {sidebarHeader}
              <div className="overflow-y-auto max-h-[calc(100vh-140px)]">
                {renderNavItems(true)}
              </div>
            </div>
            {sidebarFooter}
          </div>
        </div>
      )}
    </>
  );
};
