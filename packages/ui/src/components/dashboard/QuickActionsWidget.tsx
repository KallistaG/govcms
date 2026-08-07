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
}

export const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({
  onCreatePage,
  onPublishNews,
  onAddUser,
  onViewAudit,
  onOpenSettings,
}) => {
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
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-20 gap-1.5 p-2 text-center hover:border-primary hover:bg-primary/5 transition-all"
            onClick={onCreatePage}
          >
            <FilePlus className="h-5 w-5 text-primary" />
            <span className="text-xs font-semibold">New Page</span>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-20 gap-1.5 p-2 text-center hover:border-secondary hover:bg-secondary/10 transition-all"
            onClick={onPublishNews}
          >
            <Send className="h-5 w-5 text-secondary" />
            <span className="text-xs font-semibold">Publish News</span>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-20 gap-1.5 p-2 text-center hover:border-emerald-500 hover:bg-emerald-500/10 transition-all"
            onClick={onAddUser}
          >
            <UserPlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold">Add Official</span>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-20 gap-1.5 p-2 text-center hover:border-blue-500 hover:bg-blue-500/10 transition-all"
            onClick={onViewAudit}
          >
            <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-semibold">Audit Logs</span>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-20 gap-1.5 p-2 text-center hover:border-accent hover:bg-accent transition-all col-span-2 sm:col-span-1"
            onClick={onOpenSettings}
          >
            <Settings className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs font-semibold">Settings</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
