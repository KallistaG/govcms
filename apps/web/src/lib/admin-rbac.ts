import { AuthenticatedUser, ForbiddenError, requirePermission } from './server-auth';

const REDACTED = '[REDACTED]';
const SENSITIVE_KEY_PATTERN = /(password|token|secret|jwt|credential|cookie|authorization|refresh|databaseurl|smtp|service.?role|privatekey|reset)/i;

export function requireUsersAccess(user: AuthenticatedUser): AuthenticatedUser {
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMINISTRATOR') {
    return user;
  }

  return requirePermission(user, ['users:manage']);
}

export function requireSettingsAccess(user: AuthenticatedUser): AuthenticatedUser {
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMINISTRATOR') {
    return user;
  }

  return requirePermission(user, ['settings:manage']);
}

export function requireAuditReadAccess(user: AuthenticatedUser): AuthenticatedUser {
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMINISTRATOR') {
    return user;
  }

  return requirePermission(user, ['audit:read']);
}

export function requireDashboardAccess(user: AuthenticatedUser): AuthenticatedUser {
  return user;
}

export function requireDashboardLoginsAccess(user: AuthenticatedUser): AuthenticatedUser {
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMINISTRATOR') {
    return user;
  }

  return requirePermission(user, ['audit:read']);
}

export function getScopedAgencyId(user: AuthenticatedUser): string | undefined {
  if (user.role === 'SUPER_ADMIN') {
    return undefined;
  }

  const agencyId = user.agencyId?.trim();
  return agencyId || undefined;
}

export function assertAgencyAccess(actor: AuthenticatedUser, targetAgencyId?: string | null): void {
  if (actor.role === 'SUPER_ADMIN') {
    return;
  }

  const actorAgencyId = actor.agencyId?.trim();
  const target = targetAgencyId?.trim();

  if (!actorAgencyId || !target) {
    return;
  }

  if (actorAgencyId !== target) {
    throw new ForbiddenError('Forbidden');
  }
}

export function sanitizeSensitiveKeys<T>(value: T): T {
  return redactValue(value) as T;
}

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactValue);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => {
        if (SENSITIVE_KEY_PATTERN.test(key)) {
          return [key, REDACTED];
        }

        return [key, redactValue(nestedValue)];
      }),
    );
  }

  return value;
}
