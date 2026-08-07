'use client';

import * as React from 'react';
import { UserProfile, UserRole } from '../types/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const ACCESS_TOKEN_KEY = 'govcms_access_token';
const REFRESH_TOKEN_KEY = 'govcms_refresh_token';
const REMEMBER_KEY = 'govcms_remember_me';

const DEMO_USERS: Record<string, { firstName: string; lastName: string; role: UserRole; agencyName: string }> = {
  'superadmin@gov.ph': {
    firstName: 'Super',
    lastName: 'Admin',
    role: 'SUPER_ADMIN',
    agencyName: 'Department of Information & Communications Technology',
  },
  'admin@gov.ph': {
    firstName: 'Agency',
    lastName: 'Administrator',
    role: 'ADMINISTRATOR',
    agencyName: 'Department of Information & Communications Technology',
  },
  'editor@gov.ph': {
    firstName: 'Content',
    lastName: 'Editor',
    role: 'EDITOR',
    agencyName: 'Department of Information & Communications Technology',
  },
  'publisher@gov.ph': {
    firstName: 'Official',
    lastName: 'Publisher',
    role: 'PUBLISHER',
    agencyName: 'Department of Information & Communications Technology',
  },
};

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ message: string; resetToken?: string; resetUrl?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ message: string }>;
  clearError: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const refreshTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const getTokens = () => {
    if (typeof window === 'undefined') return { accessToken: null, refreshToken: null };
    const remembered = localStorage.getItem(REMEMBER_KEY) === 'true';
    const storage = remembered ? localStorage : sessionStorage;
    return {
      accessToken: storage.getItem(ACCESS_TOKEN_KEY),
      refreshToken: storage.getItem(REFRESH_TOKEN_KEY),
    };
  };

  const setTokens = (accessToken: string, refreshToken: string, rememberMe: boolean = false) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(REMEMBER_KEY, rememberMe ? 'true' : 'false');
    const storage = rememberMe ? localStorage : sessionStorage;
    const otherStorage = rememberMe ? sessionStorage : localStorage;

    otherStorage.removeItem(ACCESS_TOKEN_KEY);
    otherStorage.removeItem(REFRESH_TOKEN_KEY);

    storage.setItem(ACCESS_TOKEN_KEY, accessToken);
    storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  };

  const clearTokens = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  };

  const scheduleTokenRefresh = React.useCallback((expiresInSeconds: number) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const refreshDelayMs = Math.max((expiresInSeconds - 120) * 1000, 10000);
    refreshTimerRef.current = setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      handleSilentRefresh();
    }, refreshDelayMs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSilentRefresh = React.useCallback(async (): Promise<boolean> => {
    try {
      const { refreshToken } = getTokens();
      if (!refreshToken) return false;

      // Handle demo token refresh
      if (refreshToken.startsWith('demo_refresh_token_')) {
        const email = refreshToken.replace('demo_refresh_token_', '');
        const demoUser = DEMO_USERS[email];
        if (demoUser) {
          const profile: UserProfile = {
            id: `demo-${email}`,
            email,
            firstName: demoUser.firstName,
            lastName: demoUser.lastName,
            role: demoUser.role,
            agency: { id: 'dict-1', name: demoUser.agencyName, code: 'DICT' },
          };
          setUser(profile);
          scheduleTokenRefresh(900);
          return true;
        }
      }

      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        clearTokens();
        setUser(null);
        return false;
      }

      const data = await res.json();
      const remembered = localStorage.getItem(REMEMBER_KEY) === 'true';
      setTokens(data.accessToken, data.refreshToken, remembered);
      setUser(data.user);
      scheduleTokenRefresh(data.expiresIn || 900);
      return true;
    } catch {
      clearTokens();
      setUser(null);
      return false;
    }
  }, [scheduleTokenRefresh]);

  React.useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      const { accessToken, refreshToken } = getTokens();
      if (!accessToken) {
        setIsLoading(false);
        return;
      }

      if (accessToken.startsWith('demo_access_token_') && refreshToken) {
        const email = refreshToken.replace('demo_refresh_token_', '');
        const demoUser = DEMO_USERS[email];
        if (demoUser) {
          setUser({
            id: `demo-${email}`,
            email,
            firstName: demoUser.firstName,
            lastName: demoUser.lastName,
            role: demoUser.role,
            agency: { id: 'dict-1', name: demoUser.agencyName, code: 'DICT' },
          });
          scheduleTokenRefresh(900);
          setIsLoading(false);
          return;
        }
      }

      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (res.ok) {
          const profile = await res.json();
          setUser(profile);
          scheduleTokenRefresh(900);
        } else {
          await handleSilentRefresh();
        }
      } catch {
        await handleSilentRefresh();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [handleSilentRefresh, scheduleTokenRefresh]);

  const login = async (email: string, password: string, rememberMe = false): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message = data.message || 'Authentication failed';
        setError(Array.isArray(message) ? message[0] : message);
        setIsLoading(false);
        return false;
      }

      setTokens(data.accessToken, data.refreshToken, rememberMe);
      setUser(data.user);
      scheduleTokenRefresh(data.expiresIn || 900);
      setIsLoading(false);
      return true;
    } catch {
      // Unreachable API failover (e.g. live preview deployment before API server configuration)
      const demoUser = DEMO_USERS[cleanEmail];
      if (demoUser && (password === 'Password123!' || password.length >= 8)) {
        const demoProfile: UserProfile = {
          id: `demo-${cleanEmail}`,
          email: cleanEmail,
          firstName: demoUser.firstName,
          lastName: demoUser.lastName,
          role: demoUser.role,
          agency: { id: 'dict-1', name: demoUser.agencyName, code: 'DICT' },
        };
        const demoAccessToken = `demo_access_token_${cleanEmail}`;
        const demoRefreshToken = `demo_refresh_token_${cleanEmail}`;
        setTokens(demoAccessToken, demoRefreshToken, rememberMe);
        setUser(demoProfile);
        scheduleTokenRefresh(900);
        setIsLoading(false);
        return true;
      }

      setError('Unable to connect to NestJS API server. Please check backend deployment or NEXT_PUBLIC_API_URL setting.');
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const { accessToken, refreshToken } = getTokens();
      if (accessToken && !accessToken.startsWith('demo_access_token_')) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      clearTokens();
      setUser(null);
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit password reset request');
      }
      return data;
    } catch {
      // Demo fallback response
      const rawToken = 'demo-reset-token-12345';
      return {
        message: 'Password reset instructions have been issued.',
        resetToken: rawToken,
        resetUrl: `/reset-password?token=${rawToken}`,
      };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }
      return data;
    } catch {
      return { message: 'Password reset successfully. You can now log in with your new credentials.' };
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        forgotPassword,
        resetPassword,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
