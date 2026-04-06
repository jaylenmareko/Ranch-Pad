import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useGetRanch, getGetRanchQueryKey } from "@workspace/api-client-react";

interface AuthContextType {
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  token: string | null;
  role: string | null;
  isViewer: boolean;
  userName: string | null;
  pendingDeleteRequests: number;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshRole: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(localStorage.getItem("ranchpad_token"));
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [pendingDeleteRequests, setPendingDeleteRequests] = useState(0);
  const queryClient = useQueryClient();
  const roleAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const handleAuthExpired = () => {
      setToken(null);
      setRole(null);
      setUserName(null);
      setPendingDeleteRequests(0);
      window.dispatchEvent(new Event("open-login-modal"));
    };

    window.addEventListener("auth-expired", handleAuthExpired);
    return () => window.removeEventListener("auth-expired", handleAuthExpired);
  }, [setLocation]);

  const { isPending } = useGetRanch({
    query: {
      queryKey: getGetRanchQueryKey(),
      enabled: !!token,
      retry: false,
    }
  });

  const fetchRole = useCallback(async () => {
    if (!token) {
      setRole(null);
      setPendingDeleteRequests(0);
      return;
    }

    if (roleAbortRef.current) roleAbortRef.current.abort();
    roleAbortRef.current = new AbortController();

    try {
      const res = await fetch("/api/team/my-role", {
        signal: roleAbortRef.current.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setRole(data.role ?? null);
        setPendingDeleteRequests(data.pendingDeleteRequests ?? 0);
      }
    } catch {
      // ignore abort or network errors
    }
  }, [token]);

  const fetchUserName = useCallback(async () => {
    if (!token) {
      setUserName(null);
      return;
    }
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUserName(data.name ?? null);
      }
    } catch {
      // ignore
    }
  }, [token]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  useEffect(() => {
    fetchUserName();
  }, [fetchUserName]);

  // Re-fetch role whenever the active ranch switches
  useEffect(() => {
    const handleRanchSwitch = () => { fetchRole(); };
    window.addEventListener("ranch-switched", handleRanchSwitch);
    return () => window.removeEventListener("ranch-switched", handleRanchSwitch);
  }, [fetchRole]);

  const login = async (newToken: string) => {
    localStorage.setItem("ranchpad_token", newToken);
    queryClient.removeQueries({ queryKey: getGetRanchQueryKey() });
    setToken(newToken);
    // Notify ranch context to refresh
    window.dispatchEvent(new Event("user-logged-in"));
    setLocation("/");
  };

  const logout = () => {
    localStorage.removeItem("ranchpad_token");
    localStorage.removeItem("ranchpad_active_ranch");
    setToken(null);
    setRole(null);
    setUserName(null);
    setPendingDeleteRequests(0);
    setLocation("/");
  };

  const value: AuthContextType = {
    isAuthenticated: !!token,
    isGuest: !token,
    isLoading: !!token && isPending,
    token,
    role,
    isViewer: role === "viewer",
    userName,
    pendingDeleteRequests,
    login,
    logout,
    refreshRole: fetchRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
