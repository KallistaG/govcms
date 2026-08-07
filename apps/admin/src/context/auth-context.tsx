'use client';

import * as React from 'react';
import { UserProfile } from '../types/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const ACCESS_TOKEN_KEY = 'govcms_access_token';
const REFRESH_TOKEN_KEY = 'govcms_refresh_token';
const REMEMBER_KEY = 'govcms_remember_me';

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

    // Clear legacy
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
  }, []);

  const handleSilentRefresh = React.useCallback(async (): Promise<boolean> => {
    try {
      const { refreshToken } = getTokens();
      if (!refreshToken) return false;

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
      const { accessToken } = getTokens();
      if (!accessToken) {
        setIsLoading(false);
        return;
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

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unable to connect to government authentication service';
      setError(errorMessage);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const { accessToken, refreshToken } = getTokens();
      if (accessToken) {
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
  };

  const resetPassword = async (token: string, newPassword: string) => {
    setError(null);
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
