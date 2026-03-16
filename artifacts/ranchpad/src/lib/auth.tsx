import React, { createContext, useContext, useEffect, useState } from 'react';
import { useGetRanch, type Ranch } from '@workspace/api-client-react';

// Setup global fetch interceptor to inject JWT token
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const token = localStorage.getItem('ranchpad_token');
  const fetchInit = init || {};
  
  if (token) {
    fetchInit.headers = {
      ...fetchInit.headers,
      Authorization: `Bearer ${token}`
    };
  }
  
  const response = await originalFetch(input, fetchInit);
  
  if (response.status === 401) {
    localStorage.removeItem('ranchpad_token');
    window.dispatchEvent(new Event('auth-unauthorized'));
  }
  
  return response;
};

interface AuthContextType {
  isAuthenticated: boolean;
  ranch: Ranch | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('ranchpad_token'));

  // We rely on the ranch profile to verify the token is valid
  const { data: ranch, isLoading: isRanchLoading } = useGetRanch({
    query: {
      enabled: !!token,
      retry: false
    }
  });

  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
    };
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, []);

  const isAuthenticated = !!token && !!ranch;
  const isLoading = !!token && isRanchLoading;

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      ranch: ranch || null,
      login: (newToken: string) => {
        localStorage.setItem('ranchpad_token', newToken);
        setToken(newToken);
      },
      logout: () => {
        localStorage.removeItem('ranchpad_token');
        setToken(null);
      },
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
