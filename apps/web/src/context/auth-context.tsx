'use client';

import * as React from 'react';
import { UserProfile } from '../types/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const ACCESS_TOKEN_KEY = 'govcms_access_token';
const REFRESH_TOKEN_KEY = 'govcms_refresh_token';
const REMEMBER_KEY = 'govcms_remember_me';
const USER_PROFILE_KEY = 'govcms_user_profile';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ message: string; resetUrl?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ message: string }>;
  clearError: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const getTokens = () => {
    if (typeof window === 'undefined') return { accessToken: null, refreshToken: null };
    const remembered = localStorage.getItem(REMEMBER_KEY) === 'true';
    const storage = remembered ? localStorage : sessionStorage;
    const token = storage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);
    const refresh = storage.getItem(REFRESH_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
    return {
      accessToken: token,
      refreshToken: refresh,
    };
  };

  const setTokensAndProfile = (accessToken: string, refreshToken: string, profile: UserProfile, rememberMe: boolean = false) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(REMEMBER_KEY, rememberMe ? 'true' : 'false');
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
    
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(ACCESS_TOKEN_KEY, accessToken);
    storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  };

  const clearTokens = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(REMEMBER_KEY);
    localStorage.removeItem(USER_PROFILE_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  };

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
          if (typeof window !== 'undefined') {
            localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
          }
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

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

      if (!data.accessToken || !data.user) {
        setError('Authentication response invalid');
        setUser(null);
        setIsLoading(false);
        return false;
      }

      setTokensAndProfile(data.accessToken, data.refreshToken || data.accessToken, data.user, rememberMe);
      setUser(data.user);
      setIsLoading(false);
      return true;
    } catch {
      setError('Authentication service unavailable');
      setUser(null);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const { accessToken } = getTokens();
      if (accessToken) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }).catch(() => {});
      }
    } finally {
      clearTokens();
      setUser(null);
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
      const message = 'Failed to submit password reset request';
      setError(message);
      throw new Error(message);
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    setError(null);
    if (!token) {
      const message = 'Reset token is required';
      setError(message);
      throw new Error(message);
    }
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
      throw new Error('Failed to reset password');
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
