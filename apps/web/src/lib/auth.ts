export const TOKEN_KEY = 'govcms_jwt_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function removeStoredToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getAuthHeader(): Record<string, string> {
  const token = getStoredToken();
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
}
