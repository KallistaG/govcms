import * as React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { cn } from '../../lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
  progress?: number;
  iconBgColor?: string;
  iconColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  change,
  changeType = 'neutral',
  subtitle,
  progress,
  iconBgColor = 'bg-primary/10',
  iconColor = 'text-primary',
}) => {
  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-md border-border/80">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shadow-2xs', iconBgColor)}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between gap-2">
          <span className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {value}
          </span>
          {change && (
            <Badge
              variant={
                changeType === 'positive'
                  ? 'success'
                  : changeType === 'negative'
                  ? 'destructive'
                  : 'secondary'
              }
              className="text-[10px] font-bold px-1.5 py-0.5"
            >
              {change}
            </Badge>
          )}
        </div>

        {progress !== undefined && (
          <div className="mt-3 space-y-1">
            <Progress value={progress} className="h-1.5" />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>Used: {progress}%</span>
              <span>Quota Limit</span>
            </div>
          </div>
        )}

        {subtitle && progress === undefined && (
          <p className="mt-1 text-[11px] text-muted-foreground truncate">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
};
