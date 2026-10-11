"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useCart } from "@/context/CartContext";
import { useCartQuote } from "@/hooks/useCartQuote";
import { formatBRL } from "@/utils/format";
import { CartItem } from "./CartItem";

/** Lista + totais. Preços e disponibilidade vêm sempre do backend (/cart/quote). */
export function CartContents({ onNavigate, variant = "page" }: { onNavigate?: () => void; variant?: "page" | "drawer" }) {
  const { lines, hydrated, setQuantity, removeLine } = useCart();
  const { quote, error, loading, retry } = useCartQuote();

  if (!hydrated) return <div className="py-10 text-center text-fumaca">Carregando carrinho…</div>;

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-9" aria-hidden />}
        title="Seu carrinho está vazio"
        description="Escolha um hambúrguer no cardápio para começar o pedido."
        action={
          <Link href="/cardapio" onClick={onNavigate} className={buttonClass("primary")}>
            Ver cardápio
          </Link>
        }
      />
    );
  }

  const byKey = new Map((quote?.lines ?? []).map((l) => [l.key, l]));
  const blocked = !quote || !quote.canCheckout || loading || !!error;

  return (
    <div className="flex flex-col">
      <ul>
        <AnimatePresence initial={false}>
          {lines.map((line) => (
            <motion.li key={line.key} layout="position" exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <CartItem line={line} quoted={byKey.get(line.key)} pricing={loading} onQuantity={(n) => setQuantity(line.key, n)} onRemove={() => removeLine(line.key)} onNavigate={onNavigate} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {error ? (
        <div className="mt-4">
          <ErrorState error={error} onRetry={retry} title="Não conseguimos conferir os preços" />
        </div>
      ) : (
        <div className="mt-4 space-y-2 text-sm">
          {quote?.issues.map((issue) => (
            <p key={issue} role="alert" className="rounded-sm bg-vinho/20 px-3 py-2 text-red-200">
              {issue}
            </p>
          ))}
          <div className="flex items-center justify-between text-fumaca">
            <span>Subtotal</span>
            <span>{quote && !loading ? formatBRL(quote.subtotal) : "Calculando…"}</span>
          </div>
          <p className="text-xs text-fumaca">A taxa de entrega, se houver, aparece na etapa de dados.</p>
        </div>
      )}

      <div className={variant === "drawer" ? "pb-safe sticky bottom-0 -mx-5 mt-4 border-t border-carvao-600 bg-carvao-800 px-5 pt-4" : "mt-6"}>
        <Link
          href="/finalizar"
          onClick={onNavigate}
          aria-disabled={blocked}
          tabIndex={blocked ? -1 : undefined}
          className={buttonClass("primary", "lg", `w-full ${blocked ? "pointer-events-none opacity-50" : ""}`)}
        >
          Continuar para os dados
        </Link>
        {variant === "drawer" && (
          <Link href="/carrinho" onClick={onNavigate} className="mt-2 block py-2 text-center text-sm text-fumaca hover:text-osso">
            Ver carrinho completo
          </Link>
        )}
      </div>
    </div>
  );
}
