"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authService } from "@/services/authService";
import type { Session } from "@/types";

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Session>;
  register: (input: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<Session>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const s = await authService.getSession();
    setSession(s);
  }, []);

  useEffect(() => {
    let mounted = true;
    authService
      .getSession()
      .then((s) => mounted && setSession(s))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const s = await authService.signIn(email, password);
    setSession(s);
    return s;
  }, []);

  const register = useCallback(
    async (input: { name: string; email: string; phone: string; password: string }) => {
      const s = await authService.signUp(input);
      setSession(s);
      return s;
    },
    []
  );

  const logout = useCallback(async () => {
    await authService.signOut();
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}
