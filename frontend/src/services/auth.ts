import type { AdminUser } from "@/types";
import { request } from "./http";

export const authService = {
  /** O backend define o cookie de sessão (httpOnly). O frontend nunca guarda token nem senha. */
  login: (email: string, password: string) =>
    request<AdminUser>("/admin/auth/login", { method: "POST", body: { email, password }, admin: false }),
  logout: () => request<void>("/admin/auth/logout", { method: "POST", admin: false }),
  me: (signal?: AbortSignal) => request<AdminUser>("/admin/auth/me", { admin: false, signal }),
};
