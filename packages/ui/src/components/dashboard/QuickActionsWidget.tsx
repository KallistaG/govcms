import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { FilePlus, Send, UserPlus, ShieldCheck, Settings, Sparkles } from 'lucide-react';

export interface QuickActionsWidgetProps {
  onCreatePage?: () => void;
  onPublishNews?: () => void;
  onAddUser?: () => void;
  onViewAudit?: () => void;
  onOpenSettings?: () => void;
  canCreatePage?: boolean;
  canPublishNews?: boolean;
  canAddUser?: boolean;
  canViewAudit?: boolean;
  canOpenSettings?: boolean;
}

export const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({
  onCreatePage,
  onPublishNews,
  onAddUser,
  onViewAudit,
  onOpenSettings,
  canCreatePage = true,
  canPublishNews = true,
  canAddUser = true,
  canViewAudit = true,
  canOpenSettings = true,
}) => {
  const actions = [
    canCreatePage && {
      key: 'create-page',
      label: 'New Page',
      icon: FilePlus,
      iconClassName: 'text-primary',
      className: 'hover:border-primary hover:bg-primary/5 transition-all',
      onClick: onCreatePage,
    },
    canPublishNews && {
      key: 'publish-news',
      label: 'Publish News',
      icon: Send,
      iconClassName: 'text-secondary',
      className: 'hover:border-secondary hover:bg-secondary/10 transition-all',
      onClick: onPublishNews,
    },
    canAddUser && {
      key: 'add-user',
      label: 'Add Official',
      icon: UserPlus,
      iconClassName: 'text-emerald-600 dark:text-emerald-400',
      className: 'hover:border-emerald-500 hover:bg-emerald-500/10 transition-all',
      onClick: onAddUser,
    },
    canViewAudit && {
      key: 'audit',
      label: 'Audit Logs',
      icon: ShieldCheck,
      iconClassName: 'text-blue-600 dark:text-blue-400',
      className: 'hover:border-blue-500 hover:bg-blue-500/10 transition-all',
      onClick: onViewAudit,
    },
    canOpenSettings && {
      key: 'settings',
      label: 'Settings',
      icon: Settings,
      iconClassName: 'text-muted-foreground',
      className: 'hover:border-accent hover:bg-accent transition-all col-span-2 sm:col-span-1',
      onClick: onOpenSettings,
    },
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    iconClassName: string;
    className: string;
    onClick?: () => void;
  }>;

  return (
    <Card className="border-border/80 bg-linear-to-br from-card via-card to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-secondary" />
          <div>
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription className="text-xs">
              Frequent administrative tasks and agency workflows.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {actions.length > 0 ? (
            actions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.key}
                  variant="outline"
                  className={`flex flex-col items-center justify-center h-20 gap-1.5 p-2 text-center ${action.className}`}
                  onClick={action.onClick}
                >
                  <Icon className={`h-5 w-5 ${action.iconClassName}`} />
                  <span className="text-xs font-semibold">{action.label}</span>
                </Button>
              );
            })
          ) : (
            <div className="col-span-full rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
              No quick actions are available for your current permissions.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
