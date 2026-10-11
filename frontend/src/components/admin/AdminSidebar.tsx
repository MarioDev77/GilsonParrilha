"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Settings, Tags, UtensilsCrossed, Users } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { cn } from "@/utils/cn";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pedidos", label: "Pedidos", icon: Receipt },
  { href: "/admin/produtos", label: "Produtos", icon: UtensilsCrossed },
  { href: "/admin/categorias", label: "Categorias", icon: Tags },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
];

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Painel administrativo" className="space-y-1">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-11 items-center gap-3 rounded-sm px-3 text-[15px] font-medium transition-colors",
              active ? "bg-brasa text-white" : "text-fumaca hover:bg-carvao-700 hover:text-osso"
            )}
          >
            <Icon className="size-5" aria-hidden /> {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-carvao-600 bg-carvao-800 p-4 lg:flex">
      <div className="mb-8 px-1 pt-1">
        <Logo href="/admin" />
      </div>
      <AdminNav />
    </aside>
  );
}
