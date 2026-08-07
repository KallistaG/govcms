import * as React from 'react';
import { Header, HeaderProps } from './Header';
import { Sidebar, SidebarProps } from './Sidebar';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface DashboardShellProps {
  headerProps?: Partial<HeaderProps>;
  sidebarProps?: Partial<SidebarProps>;
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  headerProps,
  sidebarProps,
  breadcrumbs = [{ label: 'Dashboard', href: '/dashboard' }],
  title = 'Government Administration Dashboard',
  description = 'Manage official government press releases, notices, agency assets, and system configurations.',
  actions,
  children,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col antialiased">
      <div className="flex flex-1">
        {/* Responsive Sidebar */}
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          isMobileOpen={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
          {...sidebarProps}
        />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Header */}
          <Header
            onToggleMobileSidebar={() => setIsMobileOpen(!isMobileOpen)}
            {...headerProps}
          />

          {/* Breadcrumb Bar */}
          <div className="border-b bg-card/50 px-4 py-2.5 sm:px-6">
            <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <a href="/dashboard" className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Home className="h-3.5 w-3.5 text-primary" />
                <span className="sr-only">Home</span>
              </a>
              {breadcrumbs.map((item, idx) => (
                <React.Fragment key={idx}>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                  {item.href ? (
                    <a href={item.href} className="hover:text-foreground transition-colors">
                      {item.label}
                    </a>
                  ) : (
                    <span className="font-semibold text-foreground">{item.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Page Title & Action Header Slot */}
          <div className="border-b bg-background px-4 py-5 sm:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {title}
                </h1>
                {description && (
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                    {description}
                  </p>
                )}
              </div>
              {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
            </div>
          </div>

          {/* Dashboard Children Container */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted/10">
            {children}
          </main>

          {/* Global Government Footer */}
          <footer className="border-t bg-card px-4 py-3 sm:px-6 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">GovCMS</span>
              <span>• Official Republic Government CMS Engine</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <a href="#" className="hover:underline">Privacy Policy</a>
              <a href="#" className="hover:underline">Terms of Service</a>
              <a href="#" className="hover:underline">System Diagnostics</a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
