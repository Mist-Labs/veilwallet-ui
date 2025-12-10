'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { storeSession, clearSession, getSession, isSessionValid } from '@/utils/session';
import type { User, LoginCredentials, SignupData, OTPVerification } from '@/types';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; requiresOTP?: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; requiresOTP?: boolean; error?: string }>;
  logout: () => Promise<void>;
  verifyOTP: (data: OTPVerification) => Promise<{ success: boolean; error?: string }>;
  requestOTP: (email: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      if (!isSessionValid()) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await authService.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        clearSession();
        setUser(null);
      }
    } catch (error) {
      clearSession();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);
      if (response.success && response.data) {
        if (response.data.sessionToken) {
          const session = {
            token: response.data.sessionToken,
            expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
            userId: response.data.user.id,
          };
          storeSession(session);
          setUser(response.data.user);
          return { success: true };
        } else if (response.data.requiresOTP) {
          return { success: true, requiresOTP: true };
        }
      }
      return { success: false, error: response.error || 'Login failed' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
    }
  }, []);

  const signup = useCallback(async (data: SignupData) => {
    try {
      const response = await authService.signup(data);
      if (response.success && response.data) {
        if (response.data.requiresOTP) {
          return { success: true, requiresOTP: true };
        } else if (response.data.sessionToken) {
          const session = {
            token: response.data.sessionToken,
            expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
            userId: response.data.user.id,
          };
          storeSession(session);
          setUser(response.data.user);
          return { success: true };
        }
      }
      return { success: false, error: response.error || 'Signup failed' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Signup failed' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearSession();
      setUser(null);
      router.push('/auth/login');
    }
  }, [router]);

  const verifyOTP = useCallback(async (data: OTPVerification) => {
    try {
      const response = await authService.verifyOTP(data);
      if (response.success && response.data) {
        const session = {
          token: response.data.sessionToken,
          expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
          userId: response.data.user.id,
        };
        storeSession(session);
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, error: response.error || 'OTP verification failed' };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'OTP verification failed' };
    }
  }, []);

  const requestOTP = useCallback(async (email: string) => {
    try {
      const response = await authService.requestOTP(email);
      return { success: response.success, error: response.error };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'OTP request failed' };
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await checkAuth();
  }, [checkAuth]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    verifyOTP,
    requestOTP,
    refreshUser,
  };
}

