export type UserRole = 'SUPER_ADMIN' | 'ADMINISTRATOR' | 'EDITOR' | 'PUBLISHER';

export interface UserAgency {
  id: string;
  name: string;
  code: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  permissions?: string[] | string | null;
  agency?: UserAgency | null;
  agencyId?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserProfile;
}
