"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { ProductImage } from "@/components/products/ProductImage";
import type { CartLine, QuotedLine } from "@/types";
import { cn } from "@/utils/cn";
import { formatBRL } from "@/utils/format";
import { QuantityStepper } from "./QuantityStepper";

interface Props {
  line: CartLine;
  quoted?: QuotedLine;
  pricing: boolean;
  onQuantity: (n: number) => void;
  onRemove: () => void;
  onNavigate?: () => void;
  readOnly?: boolean;
}

export function CartItem({ line, quoted, pricing, onQuantity, onRemove, onNavigate, readOnly }: Props) {
  const name = quoted?.name ?? line.name;
  const unavailable = quoted ? !quoted.available : false;
  const addons = quoted?.addons ?? [];

  return (
    <div className={cn("flex gap-3 border-b border-carvao-600 py-4", unavailable && "opacity-90")}>
      <ProductImage src={quoted?.imageUrl ?? null} alt={name} className="size-20 shrink-0 rounded-sm" grayscale={unavailable} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl font-bold leading-tight">{name}</h3>
          {!readOnly && (
            <button type="button" onClick={onRemove} aria-label={`Remover ${name} do carrinho`} className="grid size-9 shrink-0 place-items-center rounded-sm text-fumaca hover:bg-carvao-700 hover:text-red-300">
              <Trash2 className="size-4" aria-hidden />
            </button>
          )}
        </div>

        {addons.length > 0 && <p className="text-xs text-fumaca">Adicionais: {addons.map((a) => a.name).join(", ")}</p>}
        {line.removedIngredients.length > 0 && <p className="text-xs text-fumaca">Sem: {line.removedIngredients.join(", ")}</p>}
        {line.notes && <p className="text-xs text-fumaca">Obs.: {line.notes}</p>}
        {(quoted?.issue || unavailable) && (
          <p role="alert" className="mt-1 text-xs font-semibold text-red-300">
            {quoted?.issue ?? "Este item está indisponível. Remova-o para continuar."}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {readOnly ? <span className="text-sm text-fumaca">Qtd. {line.quantity}</span> : <QuantityStepper value={line.quantity} onChange={onQuantity} label={name} />}
            {!readOnly && (
              <Link
                href={`/produto/${encodeURIComponent(line.productId)}?editar=${encodeURIComponent(line.key)}`}
                onClick={onNavigate}
                className="inline-flex h-10 items-center gap-1 rounded-sm px-2 text-sm text-fumaca hover:bg-carvao-700 hover:text-osso"
              >
                <Pencil className="size-3.5" aria-hidden /> Editar
              </Link>
            )}
          </div>
          <span className="text-lg font-bold text-cobre-300">
            {quoted ? formatBRL(quoted.subtotal) : pricing ? <span className="skeleton inline-block h-5 w-16 align-middle" aria-label="Calculando preço" /> : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}
