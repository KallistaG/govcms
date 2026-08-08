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
  agency?: UserAgency | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserProfile;
}
