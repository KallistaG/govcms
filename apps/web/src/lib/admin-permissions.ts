import { LayoutDashboard, FileText, FolderOpen, Menu as MenuIcon, Users as UsersIcon, Settings, BarChart3, Sparkles } from 'lucide-react';
import type { MenuItem } from '@govcms/ui';
import type { UserProfile } from '../types/auth';

const EDITORIAL_ROLES = new Set(['SUPER_ADMIN', 'ADMINISTRATOR', 'EDITOR', 'PUBLISHER']);

function normalizePermissions(permissions: UserProfile['permissions']): string[] {
  if (!permissions) {
    return [];
  }

  if (Array.isArray(permissions)) {
    return permissions.map((permission) => permission.trim()).filter(Boolean);
  }

  if (typeof permissions === 'string') {
    try {
      const parsed = JSON.parse(permissions);
      return Array.isArray(parsed)
        ? parsed.map((permission) => String(permission).trim()).filter(Boolean)
        : [];
    } catch {
      return permissions
        .split(',')
        .map((permission) => permission.trim())
        .filter(Boolean);
    }
  }

  return [];
}

export function hasPermission(user: UserProfile | null | undefined, requiredPermissions: string | string[]): boolean {
  if (!user) {
    return false;
  }

  if (user.role === 'SUPER_ADMIN') {
    return true;
  }

  const permissions = new Set(normalizePermissions(user.permissions));
  const list = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

  return list.some((permission) => permissions.has(permission.trim()));
}

export function isEditorialRole(user: UserProfile | null | undefined): boolean {
  return !!user && EDITORIAL_ROLES.has(user.role);
}

export function canAccessDashboard(user: UserProfile | null | undefined): boolean {
  return !!user && isEditorialRole(user);
}

export function canAccessContent(user: UserProfile | null | undefined): boolean {
  return canCreateContent(user) || canPublishContent(user) || canDeleteContent(user);
}

export function canCreateContent(user: UserProfile | null | undefined): boolean {
  return !!user && (isEditorialRole(user) || hasPermission(user, 'content:create'));
}

export function canPublishContent(user: UserProfile | null | undefined): boolean {
  return !!user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMINISTRATOR' || user.role === 'PUBLISHER' || hasPermission(user, 'content:publish'));
}

export function canDeleteContent(user: UserProfile | null | undefined): boolean {
  return !!user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMINISTRATOR' || hasPermission(user, 'content:delete'));
}

export function canArchiveContent(user: UserProfile | null | undefined): boolean {
  return canCreateContent(user);
}

export function canManageMenus(user: UserProfile | null | undefined): boolean {
  return !!user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMINISTRATOR' || hasPermission(user, 'menu:manage'));
}

export function canManageUsers(user: UserProfile | null | undefined): boolean {
  return !!user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMINISTRATOR' || hasPermission(user, 'users:manage'));
}

export function canManageSettings(user: UserProfile | null | undefined): boolean {
  return !!user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMINISTRATOR' || hasPermission(user, 'settings:manage'));
}

export function canReadAuditLogs(user: UserProfile | null | undefined): boolean {
  return !!user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMINISTRATOR' || hasPermission(user, 'audit:read'));
}

export function canAccessHomepageBuilder(user: UserProfile | null | undefined): boolean {
  return !!user && (isEditorialRole(user) || hasPermission(user, 'content:create') || hasPermission(user, 'content:publish'));
}

export function canEditHomepage(user: UserProfile | null | undefined): boolean {
  return canAccessHomepageBuilder(user);
}

export function canPublishHomepage(user: UserProfile | null | undefined): boolean {
  return canPublishContent(user);
}

export function canAccessMediaLibrary(user: UserProfile | null | undefined): boolean {
  return !!user && isEditorialRole(user);
}

export function buildAdminSidebarItems(user: UserProfile | null): MenuItem[] {
  const items: MenuItem[] = [];

  items.push({
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  });

  if (canAccessHomepageBuilder(user)) {
    items.push({
      title: 'Page Builder',
      icon: Sparkles,
      badge: 'Draft',
      children: [
        { title: 'Homepage Builder', href: '/admin/page-builder/homepage' },
        { title: 'Custom Pages', href: '/admin/pages' },
      ],
    });
  }

  if (canAccessContent(user)) {
    items.push({
      title: 'Content',
      href: '/admin/content',
      icon: FileText,
      badge: 'CMS',
      children: [{ title: 'All Content Items', href: '/admin/content' }],
    });
  }

  if (canAccessMediaLibrary(user)) {
    items.push({
      title: 'Media Library',
      href: '/admin/media',
      icon: FolderOpen,
      children: [{ title: 'Media Asset Library', href: '/admin/media' }],
    });
  }

  if (canManageMenus(user)) {
    items.push({
      title: 'Menu Builder',
      href: '/admin/menus',
      icon: MenuIcon,
      children: [{ title: 'Navigation Menus', href: '/admin/menus' }],
    });
  }

  if (canManageUsers(user)) {
    items.push({
      title: 'Users & Access',
      href: '/admin/users',
      icon: UsersIcon,
      children: [{ title: 'User Management', href: '/admin/users' }],
    });
  }

  if (canManageSettings(user)) {
    items.push({
      title: 'Settings & Theme',
      icon: Settings,
      children: [
        { title: 'Website Settings', href: '/admin/settings/general' },
        { title: 'Theme Manager', href: '/admin/settings/theme' },
      ],
    });
  }

  if (canReadAuditLogs(user)) {
    items.push({
      title: 'Reports & Logs',
      icon: BarChart3,
      children: [{ title: 'Audit Trail Logs', href: '/admin/reports/audit-logs' }],
    });
  }

  return items;
}
