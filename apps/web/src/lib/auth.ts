export const TOKEN_KEY = 'govcms_access_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem('govcms_access_token') ||
    sessionStorage.getItem('govcms_access_token') ||
    localStorage.getItem('govcms_jwt_token') ||
    sessionStorage.getItem('govcms_jwt_token')
  );
}

export function setStoredToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('govcms_access_token', token);
    localStorage.setItem('govcms_jwt_token', token);
    document.cookie = `govcms_access_token=${token}; path=/; max-age=604800; SameSite=Lax`;
  }
}

export function removeStoredToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('govcms_access_token');
    localStorage.removeItem('govcms_jwt_token');
    sessionStorage.removeItem('govcms_access_token');
    sessionStorage.removeItem('govcms_jwt_token');
    document.cookie = 'govcms_access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
}

export function getAuthHeader(): Record<string, string> {
  const token = getStoredToken();
  if (!token) return {};
  return {
    Authorization: `Bearer ${token}`,
  };
}
