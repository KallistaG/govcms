import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Activity, ShieldCheck, FileText, UserPlus, Globe, LogIn } from 'lucide-react';

export interface ActivityItem {
  id: string;
  userName?: string | null;
  userEmail?: string;
  userAvatar?: string;
  action?: string | null;
  target?: string;
  timestamp?: string | Date | null;
  type?: 'login' | 'content' | 'user' | 'system';
}

export interface ActivityFeedProps {
  activities?: ActivityItem[];
  title?: string;
  description?: string;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities = [],
  title = 'Recent System Activity',
  description = 'Live timeline of administrative actions and content updates across agencies.',
}) => {
  const normalizeName = (item: ActivityItem) => {
    const legacyUser = item as ActivityItem & {
      user?: { name?: string | null; avatar?: string | null };
      displayName?: string | null;
    };

    const name =
      item.userName?.trim() ||
      legacyUser.user?.name?.trim() ||
      legacyUser.displayName?.trim() ||
      'System';

    return name || 'System';
  };

  const getInitials = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return 'SY';

    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'SY';
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase() || 'SY';
    }

    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase() || 'SY';
  };

  const formatTimestamp = (value?: string | Date | null) => {
    if (!value) return 'Unknown time';

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown time';

    return date.toLocaleString();
  };

  const getActionIcon = (type?: string) => {
    switch (type) {
      case 'login':
        return <LogIn className="h-3.5 w-3.5 text-blue-500" />;
      case 'content':
        return <FileText className="h-3.5 w-3.5 text-amber-500" />;
      case 'user':
        return <UserPlus className="h-3.5 w-3.5 text-emerald-500" />;
      case 'system':
        return <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />;
      default:
        return <Globe className="h-3.5 w-3.5 text-primary" />;
    }
  };

  return (
    <Card className="h-full border-border/80">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No recent activity recorded.
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {activities.map((item) => (
              <div key={item.id} className="relative flex items-start gap-3 text-xs">
                {/* Dot Icon */}
                <div className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-background border shadow-2xs">
                  {getActionIcon(item.type)}
                </div>

                {(() => {
                  const legacyUser = item as ActivityItem & {
                    user?: { name?: string | null; avatar?: string | null };
                    displayName?: string | null;
                  };
                  const displayName = normalizeName(item);
                  const avatarSrc = item.userAvatar || legacyUser.user?.avatar || undefined;
                  const avatarFallback = getInitials(displayName);
                  const actionText = item.action?.trim() || 'performed an action';
                  const targetText = item.target?.trim();

                  return (
                    <>
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={avatarSrc} alt={displayName} />
                        <AvatarFallback>{avatarFallback}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground">
                          {displayName}{' '}
                          <span className="font-normal text-muted-foreground">{actionText}</span>
                          {targetText && (
                            <span className="font-semibold text-primary"> "{targetText}"</span>
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          {formatTimestamp(item.timestamp)}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
