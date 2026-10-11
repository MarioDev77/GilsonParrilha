import type { AdminUser } from "@/types";
import { request, setCsrfToken } from "./http";
import { toAdminUser, type ApiAdmin } from "./mappers";

interface Session {
  admin: ApiAdmin;
  csrfToken: string;
}

function accept(session: Session): AdminUser {
  setCsrfToken(session.csrfToken);
  return toAdminUser(session.admin);
}

export const authService = {
  /**
   * O backend define o cookie de sessão (httpOnly) e devolve o token CSRF, que fica só em memória
   * (veja `setCsrfToken`). O frontend nunca guarda a sessão nem a senha.
   */
  login: async (email: string, password: string) =>
    accept(await request<Session>("/admin/auth/login", { method: "POST", body: { email, password }, admin: false })),
  logout: async () => {
    try {
      await request<void>("/admin/auth/logout", { method: "POST", admin: false });
    } finally {
      setCsrfToken(null);
    }
  },
  /** Também devolve um token CSRF novo: é assim que ele volta depois de recarregar a página. */
  me: async (signal?: AbortSignal) => accept(await request<Session>("/admin/auth/me", { admin: false, signal })),
};
