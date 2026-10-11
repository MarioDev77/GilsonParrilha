"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ADMIN_UNAUTHORIZED_EVENT, ApiError } from "@/services/http";
import { authService } from "@/services/auth";
import type { AdminUser } from "@/types";

type Status = "loading" | "authenticated" | "anonymous";

interface AdminAuthState {
  user: AdminUser | null;
  status: Status;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AdminAuthState | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  // A sessão é verificada pelo backend; o frontend só reflete o resultado.
  useEffect(() => {
    const controller = new AbortController();
    authService
      .me(controller.signal)
      .then((u) => {
        setUser(u);
        setStatus("authenticated");
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setUser(null);
        setStatus("anonymous");
        if (err instanceof ApiError && err.status === 0) toast.error(err.message);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const onExpired = () => {
      setUser((prev) => {
        if (prev) toast.warning("Sua sessão expirou. Entre novamente.");
        return null;
      });
      setStatus("anonymous");
    };
    window.addEventListener(ADMIN_UNAUTHORIZED_EVENT, onExpired);
    return () => window.removeEventListener(ADMIN_UNAUTHORIZED_EVENT, onExpired);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const u = await authService.login(email, password);
    setUser(u);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setStatus("anonymous");
    }
  }, []);

  const value = useMemo(() => ({ user, status, login, logout }), [user, status, login, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdminAuth(): AdminAuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdminAuth deve ser usado dentro de AdminAuthProvider");
  return ctx;
}
