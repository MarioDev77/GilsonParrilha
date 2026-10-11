"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { AdminNav } from "./AdminSidebar";

export function AdminHeader() {
  const { user, logout } = useAdminAuth();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [leaving, setLeaving] = useState(false);

  async function handleLogout() {
    setLeaving(true);
    try {
      await logout();
    } finally {
      router.replace("/admin/login");
    }
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-carvao-600 bg-carvao-800 px-4">
      <div className="flex items-center gap-3 lg:hidden">
        <button type="button" onClick={() => setMenu(true)} aria-label="Abrir menu do painel" className="grid size-11 place-items-center rounded-sm hover:bg-carvao-700">
          <Menu className="size-6" aria-hidden />
        </button>
        <Logo href="/admin" className="scale-90" />
      </div>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-3">
        <div className="hidden text-right text-sm sm:block">
          <p className="font-semibold leading-tight">{user?.name}</p>
          <p className="text-xs text-fumaca">{user?.role}</p>
        </div>
        <Button variant="secondary" size="sm" loading={leaving} onClick={handleLogout} icon={<LogOut className="size-4" aria-hidden />}>
          Sair
        </Button>
      </div>
      <Modal open={menu} onClose={() => setMenu(false)} title="Menu" variant="drawer">
        <AdminNav onNavigate={() => setMenu(false)} />
      </Modal>
    </header>
  );
}
