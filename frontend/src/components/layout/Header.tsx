"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { cn } from "@/utils/cn";
import { Logo } from "./Logo";

const NAV = [
  { href: "/", label: "Início" },
  { href: "/cardapio", label: "Cardápio" },
  { href: "/#horarios", label: "Horários" },
  { href: "/#contato", label: "Contato" },
];

export function Header() {
  const pathname = usePathname();
  const { count, openDrawer } = useCart();
  const { settings } = useSettings();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-carvao-600 bg-carvao/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo logoUrl={settings?.logoUrl} name={settings?.businessName} />

        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={cn(
                "rounded-sm px-3 py-2 text-[15px] font-medium text-fumaca transition-colors hover:text-osso",
                pathname === item.href && "text-osso"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={openDrawer}
            className="relative grid size-11 place-items-center rounded-sm text-osso hover:bg-carvao-700"
            aria-label={count > 0 ? `Abrir carrinho, ${count} ${count === 1 ? "item" : "itens"}` : "Abrir carrinho, vazio"}
          >
            <ShoppingBag className="size-6" aria-hidden />
            {count > 0 && (
              <span className="absolute right-0.5 top-0.5 grid min-w-5 place-items-center rounded-full bg-brasa px-1 text-xs font-bold leading-5 text-white">
                {count}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="grid size-11 place-items-center rounded-sm text-osso hover:bg-carvao-700 md:hidden"
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          >
            {menuOpen ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="menu-mobile" aria-label="Principal" className="border-t border-carvao-600 bg-carvao px-4 py-2 md:hidden">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="block rounded-sm px-2 py-3 text-lg font-medium hover:bg-carvao-700">
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
