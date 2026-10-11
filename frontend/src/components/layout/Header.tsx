"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, MessageCircle, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { cn } from "@/utils/cn";
import { waLink } from "@/utils/whatsapp";
import { Logo } from "./Logo";

const NAV = [
  { href: "/", label: "Início" },
  { href: "/cardapio", label: "Cardápio" },
  { href: "/#horarios", label: "Horários" },
  { href: "/#contato", label: "Contato" },
];

const ORDER_MESSAGE = "Olá! Quero fazer um pedido.";

export function Header() {
  const pathname = usePathname();
  const { count, openDrawer } = useCart();
  const { settings } = useSettings();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => (href === "/cardapio" ? pathname === href || pathname.startsWith("/produto") : pathname === href);
  const whatsappHref = settings?.whatsapp ? waLink(settings.whatsapp, ORDER_MESSAGE) : null;

  return (
    <header className="sticky top-0 z-40 border-b border-carvao-600 bg-carvao/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo logoUrl={settings?.logoUrl} name={settings?.businessName} />

        <nav aria-label="Principal" className="hidden h-full items-stretch gap-1 md:flex">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center px-3 text-[15px] font-medium text-fumaca transition-colors hover:text-osso",
                  active && "text-osso"
                )}
              >
                {item.label}
                {/* linha de brasa sob o item ativo */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-3 -bottom-px h-0.5 origin-left bg-brasa shadow-[0_0_10px_rgb(212_86_26/0.8)] transition-transform duration-300",
                    active ? "scale-x-100" : "scale-x-0"
                  )}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Pedir pelo WhatsApp (abre em nova aba)"
              className="inline-flex h-11 items-center gap-2 rounded-sm px-3 text-[15px] font-semibold text-osso ring-1 ring-inset ring-cobre/50 transition-colors hover:bg-carvao-700 hover:ring-cobre max-lg:w-11 max-lg:justify-center max-lg:px-0"
            >
              <MessageCircle className="size-5 text-cobre-300" aria-hidden />
              <span className="hidden lg:inline">Pedir pelo WhatsApp</span>
            </a>
          )}
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
        <nav id="menu-mobile" aria-label="Principal" className="animate-dropIn border-t border-carvao-600 bg-carvao px-4 py-2 md:hidden">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block rounded-sm border-l-2 border-transparent px-3 py-3 text-lg font-medium hover:bg-carvao-700",
                  active && "border-brasa bg-carvao-800"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
