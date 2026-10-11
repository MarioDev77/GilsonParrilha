"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoadingState } from "@/components/ui/States";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { AdminHeader } from "./AdminHeader";
import { AdminSidebar } from "./AdminSidebar";

/**
 * A interface só reflete a sessão. Quem decide acesso é o backend: toda chamada
 * administrativa é verificada lá e um 401 devolve o usuário ao login.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { status } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (status === "anonymous" && !isLogin) router.replace("/admin/login");
    if (status === "authenticated" && isLogin) router.replace("/admin");
  }, [status, isLogin, router]);

  if (isLogin) {
    return status === "authenticated" ? <LoadingState label="Entrando…" className="min-h-dvh" /> : <main id="conteudo">{children}</main>;
  }
  if (status !== "authenticated") return <LoadingState label="Verificando sessão…" className="min-h-dvh" />;

  return (
    <div className="flex min-h-dvh">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader />
        <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
