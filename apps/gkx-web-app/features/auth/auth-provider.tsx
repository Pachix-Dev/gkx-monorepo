"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { loginRequest, logoutRequest, meRequest } from "@/lib/api/auth";
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "@/lib/auth/token-storage";
import { AuthTokens, AuthUser } from "@/lib/auth/types";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: React.ReactNode;
};

async function hydrateUserWithTokens(tokens: AuthTokens) {
  saveTokens(tokens);
  return meRequest();
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const refreshMe = useCallback(async () => {
    const currentUser = await meRequest();
    setUser(currentUser);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await loginRequest({ email, password });
    const currentUser = await hydrateUserWithTokens(tokens);
    setUser(currentUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Always clear local session even if the API call fails.
    } finally {
      clearTokens();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const accessToken = getAccessToken();
        const refreshToken = getRefreshToken();

        if (!accessToken && !refreshToken) {
          return;
        }

        const currentUser = await meRequest();
        if (mounted) {
          setUser(currentUser);
        }
      } catch {
        if (mounted) {
          clearTokens();
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsBootstrapping(false);
        }
      }
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isBootstrapping,
      login,
      logout,
      refreshMe,
    }),
    [isBootstrapping, login, logout, refreshMe, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
