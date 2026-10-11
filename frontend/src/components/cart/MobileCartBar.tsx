"use client";

import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";

/** Acesso rápido ao carrinho no celular. Mostra só a contagem de itens: preços vêm do backend. */
export function MobileCartBar() {
  const { count, openDrawer, hydrated } = useCart();
  const pathname = usePathname();
  const hidden = ["/carrinho", "/finalizar", "/pedido"].some((p) => pathname.startsWith(p));
  if (!hydrated || count === 0 || hidden) return null;
  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-30 px-4 pt-3 md:hidden">
      <button
        type="button"
        onClick={openDrawer}
        className="flex h-14 w-full items-center justify-between rounded-sm bg-brasa px-5 font-bold text-white shadow-[0_8px_30px_rgb(0_0_0/0.6)] active:bg-brasa-600"
      >
        <span className="flex items-center gap-2">
          <ShoppingBag className="size-5" aria-hidden /> Ver carrinho
        </span>
        <span>
          {count} {count === 1 ? "item" : "itens"}
        </span>
      </button>
    </div>
  );
}
