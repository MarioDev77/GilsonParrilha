"use client";

import Link from "next/link";
import { Plus, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/types";
import { cn } from "@/utils/cn";
import { formatBRL } from "@/utils/format";
import { ProductImage } from "./ProductImage";

const BADGE_LABEL = { mais_pedido: "Mais pedido", novidade: "Novidade" } as const;

export function ProductCard({ product }: { product: Product }) {
  const { addLine } = useCart();
  const unavailable = !product.available;
  // Lanches com adicionais ou ingredientes removíveis precisam das escolhas: levam à página do produto.
  const needsChoices = (product.hasAddons ?? product.addons.some((a) => a.available)) || product.removableIngredients.length > 0;
  const actionClass =
    "relative z-10 inline-flex h-10 items-center gap-1.5 rounded-sm bg-carvao-700 px-3 text-sm font-semibold ring-1 ring-inset ring-carvao-600 hover:bg-brasa hover:text-white hover:ring-brasa";

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-sm border border-carvao-600 bg-carvao-800 transition-[border-color,box-shadow] duration-300 focus-within:border-brasa focus-within:shadow-[0_0_32px_-6px_rgb(212_86_26/0.5)] hover:border-brasa/70 hover:shadow-[0_0_32px_-6px_rgb(212_86_26/0.5)]",
        unavailable && "opacity-80"
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-carvao-700">
        <ProductImage src={product.imageUrl} alt="" className="size-full transition-transform duration-500 group-hover:scale-[1.03]" grayscale={unavailable} />
        {/* barras de grelha na base da foto */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-[repeating-linear-gradient(90deg,transparent_0_14px,rgb(23_18_15/0.85)_14px_18px)]" aria-hidden />
        {product.badge && !unavailable && (
          <span className="absolute left-2 top-2 rounded-sm bg-brasa px-2 py-1 text-xs font-bold text-white">{BADGE_LABEL[product.badge]}</span>
        )}
        {unavailable && (
          <span className="absolute inset-0 grid place-items-center bg-carvao/60">
            <span className="rounded-sm bg-carvao px-3 py-1.5 text-sm font-semibold text-osso ring-1 ring-fumaca/50">Indisponível no momento</span>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-[1.65rem] font-bold leading-none">
          <Link href={`/produto/${encodeURIComponent(product.id)}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm text-fumaca">{product.description}</p>
        {product.ingredients.length > 0 && <p className="line-clamp-1 text-xs text-fumaca/80">{product.ingredients.join(", ")}</p>}

        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <span className={cn("text-xl font-bold", unavailable ? "text-fumaca line-through" : "text-cobre-300")}>{formatBRL(product.price)}</span>
          {needsChoices && !unavailable ? (
            <Link href={`/produto/${encodeURIComponent(product.id)}`} className={actionClass} aria-label={`Personalizar ${product.name}`}>
              <SlidersHorizontal className="size-4" aria-hidden /> Personalizar
            </Link>
          ) : (
            <button
              type="button"
              disabled={unavailable}
              onClick={() => {
                addLine({ productId: product.id, name: product.name, quantity: 1, addonIds: [], removedIngredients: [], notes: "" });
                toast.success(`${product.name} foi para o carrinho`);
              }}
              className={cn(actionClass, "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-carvao-700 disabled:hover:text-osso")}
              aria-label={`Adicionar ${product.name} ao carrinho`}
            >
              <Plus className="size-4" aria-hidden /> Adicionar
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-sm border border-carvao-600 bg-carvao-800" aria-hidden>
      <div className="skeleton aspect-[4/3]" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-6 w-2/3 rounded-sm" />
        <div className="skeleton h-4 w-full rounded-sm" />
        <div className="skeleton h-4 w-4/5 rounded-sm" />
        <div className="skeleton mt-4 h-10 w-full rounded-sm" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div role="status" aria-label="Carregando produtos" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
