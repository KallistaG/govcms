import * as React from 'react';
import {
  Bell,
  Search,
  Menu,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Settings,
  Building2,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export interface HeaderProps {
  onToggleMobileSidebar?: () => void;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  agencyName?: string;
  userAvatarUrl?: string;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileSidebar,
  userName = 'Admin User',
  userEmail = 'admin@gov.ph',
  userRole = 'SUPER_ADMIN',
  agencyName = 'Department of Information & Communications Technology',
  userAvatarUrl,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      {/* Left: Mobile Toggle & Agency Branding */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-extrabold shadow-sm">
            <Building2 className="h-5 w-5 text-secondary" />
          </div>
          <div className="hidden sm:flex sm:flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-foreground">
                GovCMS
              </span>
              <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 h-4 border-primary/30 text-primary">
                Official
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground truncate max-w-[240px] md:max-w-[320px]">
              {agencyName}
            </span>
          </div>
        </div>
      </div>

      {/* Middle: Global Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search documents, services, audit logs... (Press Ctrl+K)"
            className="h-9 w-full rounded-md border border-input bg-muted/40 pl-9 pr-4 text-xs shadow-inner transition-colors focus:bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Right: Actions, Notifications, User Menu */}
      <div className="flex items-center gap-2">
        {/* Status Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Portal Online</span>
        </div>

        {/* Notifications Button */}
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-secondary ring-2 ring-background" />
        </Button>

        <div className="h-6 w-px bg-border mx-1" />

        {/* User Menu Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 rounded-full pl-2 pr-3 flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={userAvatarUrl} alt={userName} />
                <AvatarFallback>{userName.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold leading-none">{userName}</span>
                <span className="text-[10px] text-muted-foreground uppercase font-mono mt-0.5">
                  {userRole}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">{userName}</p>
                <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                <div className="pt-1">
                  <Badge variant="secondary" className="text-[10px]">
                    <ShieldCheck className="h-3 w-3 mr-1" /> {userRole}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <UserIcon className="mr-2 h-4 w-4" /> Profile & Credentials
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" /> Agency Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
