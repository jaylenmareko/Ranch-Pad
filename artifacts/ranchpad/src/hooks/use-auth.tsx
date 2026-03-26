import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useGetRanch, getGetRanchQueryKey } from "@workspace/api-client-react";
import { getGuestAnimals, clearGuestAnimals } from "@/lib/guest-store";

interface AuthContextType {
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  token: string | null;
  role: string | null;
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
  const [pendingDeleteRequests, setPendingDeleteRequests] = useState(0);
  const queryClient = useQueryClient();
  const roleAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const handleAuthExpired = () => {
      setToken(null);
      setRole(null);
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

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  const login = async (newToken: string) => {
    const guestAnimals = getGuestAnimals();
    if (guestAnimals.length > 0) {
      try {
        for (const animal of guestAnimals) {
          await fetch("/api/animals", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${newToken}`,
            },
            body: JSON.stringify({
              name: animal.name,
              tagNumber: animal.tagNumber,
              species: animal.species,
              breed: animal.breed,
              sex: animal.sex,
              dateOfBirth: animal.dateOfBirth,
              expectedDueDate: animal.expectedDueDate,
              damId: null,
              sireId: null,
              notes: animal.notes,
            }),
          });
        }
      } finally {
        clearGuestAnimals();
      }
    }

    localStorage.setItem("ranchpad_token", newToken);
    queryClient.removeQueries({ queryKey: getGetRanchQueryKey() });
    setToken(newToken);
    setLocation("/");
  };

  const logout = () => {
    localStorage.removeItem("ranchpad_token");
    setToken(null);
    setRole(null);
    setPendingDeleteRequests(0);
    setLocation("/");
  };

  const value: AuthContextType = {
    isAuthenticated: !!token,
    isGuest: !token,
    isLoading: !!token && isPending,
    token,
    role,
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
