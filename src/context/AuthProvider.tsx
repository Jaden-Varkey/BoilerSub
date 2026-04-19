"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiClient, ApiError } from "@/lib/apiClient";
import type { Session, User } from "@/lib/types";

type AuthState = {
  user: User | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setSession: (session: Session, user: User) => void;
  isFullyVerified: boolean;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthState["status"]>("loading");

  const setSession = useCallback((session: Session, nextUser: User) => {
    if (typeof window === "undefined") {
      return;
    }

    if (session?.access_token) {
      window.localStorage.setItem("bs_access_token", session.access_token);
    }
    window.localStorage.setItem("bs_user", JSON.stringify(nextUser));
    setUser(nextUser);
    setStatus("authenticated");
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await apiClient.auth.me();
      setUser(data.user);
      window.localStorage.setItem("bs_user", JSON.stringify(data.user));
      setStatus("authenticated");
    } catch {
      window.localStorage.removeItem("bs_access_token");
      window.localStorage.removeItem("bs_user");
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setStatus("loading");
      const data = await apiClient.auth.login(email, password);
      if (!data.session?.access_token) {
        throw new ApiError(500, "no_session", "Login returned no session");
      }
      setSession(data.session, data.user);
    },
    [setSession],
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.auth.logout();
    } catch {
      // Clear local state even if the backend session is already gone.
    }

    window.localStorage.removeItem("bs_access_token");
    window.localStorage.removeItem("bs_user");
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    const token = window.localStorage.getItem("bs_access_token");
    const cachedUser = window.localStorage.getItem("bs_user");

    if (!token) {
      setStatus("unauthenticated");
      return;
    }

    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser) as User);
        setStatus("authenticated");
      } catch {
        window.localStorage.removeItem("bs_user");
      }
    }

    void refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        login,
        logout,
        refresh,
        setSession,
        isFullyVerified: Boolean(user?.fully_verified),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
