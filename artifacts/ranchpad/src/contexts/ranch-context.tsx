import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export interface RanchInfo {
  id: number;
  name: string;
  role: string;
  ownerName: string | null;
  isPersonal: boolean;
}

interface RanchContextType {
  ranches: RanchInfo[];
  activeRanchId: number | null;
  activeRanch: RanchInfo | null;
  hasPersonalRanch: boolean;
  isLoadingRanches: boolean;
  setActiveRanch: (id: number) => void;
  refreshRanches: () => void;
  createPersonalRanch: (data: { name: string; locationCity?: string; locationState?: string; lat?: number | null; lon?: number | null }) => Promise<RanchInfo>;
}

const RanchContext = createContext<RanchContextType | undefined>(undefined);

export function RanchProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [ranches, setRanches] = useState<RanchInfo[]>([]);
  const [activeRanchId, setActiveRanchIdState] = useState<number | null>(() => {
    const saved = localStorage.getItem("ranchpad_active_ranch");
    return saved ? parseInt(saved, 10) : null;
  });
  const [isLoadingRanches, setIsLoadingRanches] = useState(false);

  const fetchRanches = useCallback(async () => {
    const token = localStorage.getItem("ranchpad_token");
    if (!token) {
      setRanches([]);
      return;
    }

    setIsLoadingRanches(true);
    try {
      const res = await fetch("/api/ranch/my-ranches");
      if (!res.ok) return;
      const data: RanchInfo[] = await res.json();
      setRanches(data);

      // Set default active ranch if not set or if saved one is no longer valid
      const savedId = localStorage.getItem("ranchpad_active_ranch");
      const savedIdNum = savedId ? parseInt(savedId, 10) : null;
      const validSaved = savedIdNum && data.some(r => r.id === savedIdNum);

      if (!validSaved && data.length > 0) {
        // Prefer personal ranch, otherwise use first
        const personal = data.find(r => r.isPersonal);
        const defaultRanch = personal ?? data[0];
        localStorage.setItem("ranchpad_active_ranch", String(defaultRanch.id));
        setActiveRanchIdState(defaultRanch.id);
      }
    } catch {
      // ignore network errors
    } finally {
      setIsLoadingRanches(false);
    }
  }, []);

  useEffect(() => {
    fetchRanches();
  }, [fetchRanches]);

  // Re-fetch ranches when user logs in or out
  useEffect(() => {
    const handleAuthExpired = () => {
      setRanches([]);
      setActiveRanchIdState(null);
      localStorage.removeItem("ranchpad_active_ranch");
    };
    window.addEventListener("auth-expired", handleAuthExpired);
    window.addEventListener("user-logged-in", fetchRanches);
    return () => {
      window.removeEventListener("auth-expired", handleAuthExpired);
      window.removeEventListener("user-logged-in", fetchRanches);
    };
  }, [fetchRanches]);

  const setActiveRanch = useCallback((id: number) => {
    localStorage.setItem("ranchpad_active_ranch", String(id));
    setActiveRanchIdState(id);
    // Invalidate all React Query caches so pages re-fetch with new ranch context
    queryClient.invalidateQueries();
    // Notify other contexts (e.g. use-auth) to re-fetch role
    window.dispatchEvent(new CustomEvent("ranch-switched", { detail: { ranchId: id } }));
  }, [queryClient]);

  const createPersonalRanch = useCallback(async (data: {
    name: string;
    locationCity?: string;
    locationState?: string;
    lat?: number | null;
    lon?: number | null;
  }): Promise<RanchInfo> => {
    const res = await fetch("/api/ranch/create-personal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to create ranch");
    }
    const newRanch = await res.json();
    const ranchInfo: RanchInfo = { ...newRanch };
    await fetchRanches(); // refresh the list
    return ranchInfo;
  }, [fetchRanches]);

  const activeRanch = ranches.find(r => r.id === activeRanchId) ?? null;
  const hasPersonalRanch = ranches.some(r => r.isPersonal);

  return (
    <RanchContext.Provider value={{
      ranches,
      activeRanchId,
      activeRanch,
      hasPersonalRanch,
      isLoadingRanches,
      setActiveRanch,
      refreshRanches: fetchRanches,
      createPersonalRanch,
    }}>
      {children}
    </RanchContext.Provider>
  );
}

export function useRanch() {
  const context = useContext(RanchContext);
  if (context === undefined) {
    throw new Error("useRanch must be used within a RanchProvider");
  }
  return context;
}
