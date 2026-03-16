import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGetRanch } from "@workspace/api-client-react";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(localStorage.getItem("ranchpad_token"));

  useEffect(() => {
    const handleAuthExpired = () => {
      setToken(null);
      setLocation("/login");
    };

    window.addEventListener("auth-expired", handleAuthExpired);
    return () => window.removeEventListener("auth-expired", handleAuthExpired);
  }, [setLocation]);

  // We use the presence of a ranch profile as a proxy for valid authentication 
  // since the token alone might be expired.
  const { isPending, isError } = useGetRanch({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  useEffect(() => {
    if (isError) {
      localStorage.removeItem("ranchpad_token");
      setToken(null);
    }
  }, [isError]);

  const login = (newToken: string) => {
    localStorage.setItem("ranchpad_token", newToken);
    setToken(newToken);
    setLocation("/");
  };

  const logout = () => {
    localStorage.removeItem("ranchpad_token");
    setToken(null);
    setLocation("/login");
  };

  const value = {
    isAuthenticated: !!token && !isError,
    isLoading: !!token && isPending,
    token,
    login,
    logout,
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
