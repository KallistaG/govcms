import { AuthenticatedUser, ForbiddenError, requirePermission } from './server-auth';
import { getScopedAgencyId } from './admin-rbac';

export function requireAgencyScopedAccess(actor: AuthenticatedUser): string | undefined {
  if (actor.role === 'SUPER_ADMIN') {
    return undefined;
  }

  const agencyId = getScopedAgencyId(actor);
  if (!agencyId) {
    throw new ForbiddenError('Account is not assigned to an agency');
  }

  return agencyId;
}

export function requireContentReadAccess(actor: AuthenticatedUser): AuthenticatedUser {
  return actor;
}

export function requireContentEditAccess(actor: AuthenticatedUser): AuthenticatedUser {
  if (actor.role === 'SUPER_ADMIN' || actor.role === 'ADMINISTRATOR' || actor.role === 'EDITOR' || actor.role === 'PUBLISHER') {
    return actor;
  }

  return requirePermission(actor, ['content:create']);
}

export function requireContentPublishAccess(actor: AuthenticatedUser): AuthenticatedUser {
  if (actor.role === 'SUPER_ADMIN' || actor.role === 'ADMINISTRATOR' || actor.role === 'PUBLISHER') {
    return actor;
  }

  return requirePermission(actor, ['content:publish']);
}

export function requireContentDeleteAccess(actor: AuthenticatedUser): AuthenticatedUser {
  if (actor.role === 'SUPER_ADMIN' || actor.role === 'ADMINISTRATOR') {
    return actor;
  }

  return requirePermission(actor, ['content:delete']);
}

export function requireMenuManageAccess(actor: AuthenticatedUser): AuthenticatedUser {
  if (actor.role === 'SUPER_ADMIN' || actor.role === 'ADMINISTRATOR') {
    return actor;
  }

  return requirePermission(actor, ['menu:manage']);
}

export function requireHomepageEditAccess(actor: AuthenticatedUser): AuthenticatedUser {
  if (actor.role === 'SUPER_ADMIN' || actor.role === 'ADMINISTRATOR' || actor.role === 'EDITOR' || actor.role === 'PUBLISHER') {
    return actor;
  }

  return requirePermission(actor, ['content:create']);
}

export function requireHomepagePublishAccess(actor: AuthenticatedUser): AuthenticatedUser {
  if (actor.role === 'SUPER_ADMIN' || actor.role === 'ADMINISTRATOR' || actor.role === 'PUBLISHER') {
    return actor;
  }

  return requirePermission(actor, ['content:publish']);
}

export function requireMediaAccess(actor: AuthenticatedUser): AuthenticatedUser {
  if (
    actor.role === 'SUPER_ADMIN' ||
    actor.role === 'ADMINISTRATOR' ||
    actor.role === 'EDITOR' ||
    actor.role === 'PUBLISHER'
  ) {
    return actor;
  }

  return requirePermission(actor, ['media:upload']);
}

export function requireMediaUploadAccess(actor: AuthenticatedUser): AuthenticatedUser {
  return requireMediaAccess(actor);
}

export function requireMediaDeleteAccess(actor: AuthenticatedUser): AuthenticatedUser {
  if (actor.role === 'SUPER_ADMIN' || actor.role === 'ADMINISTRATOR') {
    return actor;
  }

  return requirePermission(actor, ['media:delete']);
}

