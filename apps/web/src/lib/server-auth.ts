import { cookies, headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma, RoleEnum } from '@govcms/database';
import { AUTH_COOKIE_NAME } from './auth-constants';
const MIN_JWT_SECRET_LENGTH = 32;
const SECRET_GENERATION_COMMAND = 'node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"';

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: RoleEnum;
  department: string | null;
  phone: string | null;
  avatarUrl: string | null;
  agencyId: string | null;
  permissions: string[];
}

interface JwtPayload {
  sub?: string;
  email?: string;
  role?: RoleEnum;
}

export class AuthError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'AuthError';
  }
}

export class AuthConfigurationError extends AuthError {
  constructor(message: string) {
    super(message, 500);
    this.name = 'AuthConfigurationError';
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AuthError {
  constructor(message = 'Forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret || secret.length < MIN_JWT_SECRET_LENGTH) {
    throw new AuthConfigurationError(
      `JWT_SECRET must be configured and at least ${MIN_JWT_SECRET_LENGTH} characters long. Generate one with: ${SECRET_GENERATION_COMMAND}`,
    );
  }

  return secret;
}

function parseCookieHeader(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  for (const pair of cookieHeader.split(';')) {
    const [rawKey, ...valueParts] = pair.trim().split('=');
    if (rawKey === name) {
      return decodeURIComponent(valueParts.join('='));
    }
  }

  return null;
}

async function getRequestToken(request?: Request): Promise<string | null> {
  const cookieHeader = request
    ? request.headers.get('cookie')
    : (await cookies())
        .getAll()
        .map((cookie) => `${cookie.name}=${cookie.value}`)
        .join('; ');
  const cookieToken = parseCookieHeader(cookieHeader, AUTH_COOKIE_NAME);

  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = request ? request.headers.get('authorization') : (await headers()).get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const bearerToken = authHeader.slice('Bearer '.length).trim();
  return bearerToken || null;
}

function normalizePermissions(permissions: unknown): string[] {
  if (!Array.isArray(permissions)) {
    return [];
  }

  return permissions
    .filter((permission): permission is string => typeof permission === 'string')
    .map((permission) => permission.trim())
    .filter(Boolean);
}

export function sanitizeUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: RoleEnum;
  department: string | null;
  phone: string | null;
  avatarUrl: string | null;
  agencyId: string | null;
  permissions: unknown;
}): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    department: user.department,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    agencyId: user.agencyId,
    permissions: normalizePermissions(user.permissions),
  };
}

function verifyJwt(token: string): JwtPayload {
  const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });

  if (!decoded || typeof decoded === 'string') {
    throw new UnauthorizedError();
  }

  return decoded as JwtPayload;
}

export async function getAuthenticatedUser(request?: Request): Promise<AuthenticatedUser | null> {
  const token = await getRequestToken(request);
  if (!token) {
    return null;
  }

  let payload: JwtPayload;
  try {
    payload = verifyJwt(token);
  } catch (error) {
    if (error instanceof AuthConfigurationError) {
      throw error;
    }

    return null;
  }

  const userId = typeof payload.sub === 'string' ? payload.sub.trim() : '';
  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      department: true,
      phone: true,
      avatarUrl: true,
      agencyId: true,
      permissions: true,
      isActive: true,
    },
  });

  if (!user) {
    return null;
  }

  if (!user.isActive) {
    throw new ForbiddenError('Account is inactive');
  }

  return sanitizeUser(user);
}

export async function requireAuth(request?: Request): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    throw new UnauthorizedError();
  }

  return user;
}

export function requireRole(user: AuthenticatedUser, allowedRoles: RoleEnum[]): AuthenticatedUser {
  if (user.role === 'SUPER_ADMIN' || allowedRoles.includes(user.role)) {
    return user;
  }

  throw new ForbiddenError();
}

export function requirePermission(user: AuthenticatedUser, requiredPermissions: string[]): AuthenticatedUser {
  const permissions = requiredPermissions.map((permission) => permission.trim()).filter(Boolean);

  if (!permissions.length || user.role === 'SUPER_ADMIN') {
    return user;
  }

  const granted = new Set(user.permissions);
  if (permissions.some((permission) => granted.has(permission))) {
    return user;
  }

  throw new ForbiddenError();
}

export function isAuthConfigurationError(error: unknown): error is AuthConfigurationError {
  return error instanceof AuthConfigurationError;
}
