import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useGetRanch, getGetRanchQueryKey } from "@workspace/api-client-react";
import { getGuestAnimals, clearGuestAnimals } from "@/lib/guest-store";

interface AuthContextType {
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(localStorage.getItem("ranchpad_token"));
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleAuthExpired = () => {
      setToken(null);
      setLocation("/login");
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

  const login = async (newToken: string) => {
    // Migrate any guest animals into the new account
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
    setLocation("/login");
  };

  const value: AuthContextType = {
    isAuthenticated: !!token,
    isGuest: !token,
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
