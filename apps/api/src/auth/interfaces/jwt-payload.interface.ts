export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  agencyId?: string | null;
  iat?: number;
  exp?: number;
}
