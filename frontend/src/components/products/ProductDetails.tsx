"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { Button } from "@/components/ui/Button";
import { CheckboxField, TextareaField } from "@/components/ui/Field";
import { useCart } from "@/context/CartContext";
import type { CartLine, Product } from "@/types";
import { formatBRL } from "@/utils/format";
import { ProductImage } from "./ProductImage";

const BADGE_LABEL = { mais_pedido: "Mais pedido", novidade: "Novidade" } as const;

export function ProductDetails({ product, editingLine }: { product: Product; editingLine?: CartLine }) {
  const router = useRouter();
  const { addLine, replaceLine, openDrawer } = useCart();

  const validAddonIds = useMemo(() => new Set(product.addons.filter((a) => a.available).map((a) => a.id)), [product.addons]);
  const [quantity, setQuantity] = useState(editingLine?.quantity ?? 1);
  const [addonIds, setAddonIds] = useState<string[]>(editingLine ? editingLine.addonIds.filter((id) => validAddonIds.has(id)) : []);
  const [removed, setRemoved] = useState<string[]>(editingLine?.removedIngredients ?? []);
  const [notes, setNotes] = useState(editingLine?.notes ?? "");

  const toggle = (list: string[], value: string) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  // Estimativa com os preços entregues pela API. O valor oficial é conferido pelo servidor no carrinho.
  const estimate = useMemo(() => {
    const extras = product.addons.filter((a) => addonIds.includes(a.id)).reduce((sum, a) => sum + a.price, 0);
    return (product.price + extras) * quantity;
  }, [product, addonIds, quantity]);

  function submit() {
    const line = { productId: product.id, name: product.name, quantity, addonIds, removedIngredients: removed, notes: notes.trim() };
    if (editingLine) {
      replaceLine(editingLine.key, line);
      toast.success("Item atualizado");
      router.push("/carrinho");
      return;
    }
    addLine(line);
    toast.success(`${product.name} foi para o carrinho`);
    openDrawer();
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-12">
      <div className="md:sticky md:top-24 md:self-start">
        <div className="relative overflow-hidden rounded-sm border border-carvao-600">
          <ProductImage src={product.imageUrl} alt={product.name} className="aspect-[4/3] w-full md:aspect-square" grayscale={!product.available} />
          {product.badge && <span className="absolute left-3 top-3 rounded-sm bg-brasa px-2.5 py-1 text-xs font-bold text-white">{BADGE_LABEL[product.badge]}</span>}
        </div>
      </div>

      <div>
        {product.categoryName && <p className="text-sm text-fumaca">{product.categoryName}</p>}
        <h1 className="mt-1 text-5xl font-black leading-[0.95]">{product.name}</h1>
        <p className="mt-2 text-3xl font-bold text-cobre-300">{formatBRL(product.price)}</p>
        <p className="mt-4 max-w-prose text-fumaca">{product.description}</p>

        {product.ingredients.length > 0 && (
          <section className="mt-6" aria-labelledby="ing">
            <h2 id="ing" className="text-2xl font-bold">
              Ingredientes
            </h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {product.ingredients.map((i) => (
                <li key={i} className="rounded-sm bg-carvao-700 px-2.5 py-1 text-sm text-osso/90">
                  {i}
                </li>
              ))}
            </ul>
          </section>
        )}

        {!product.available ? (
          <p role="status" className="mt-8 rounded-sm border border-carvao-600 bg-carvao-800 px-4 py-3 text-fumaca">
            Este item está indisponível no momento e não pode ser adicionado ao carrinho.
          </p>
        ) : (
          <div className="mt-8 space-y-7">
            {product.removableIngredients.length > 0 && (
              <fieldset>
                <legend className="text-2xl font-bold font-display">Retirar algum ingrediente?</legend>
                <div className="mt-3 space-y-3">
                  {product.removableIngredients.map((ing) => (
                    <CheckboxField key={ing} label={`Sem ${ing}`} checked={removed.includes(ing)} onChange={() => setRemoved((r) => toggle(r, ing))} />
                  ))}
                </div>
              </fieldset>
            )}

            {product.addons.some((a) => a.available) && (
              <fieldset>
                <legend className="font-display text-2xl font-bold">Adicionais</legend>
                <div className="mt-3 space-y-3">
                  {product.addons
                    .filter((a) => a.available)
                    .map((a) => (
                      <div key={a.id} className="flex items-start justify-between gap-3">
                        <CheckboxField label={a.name} checked={addonIds.includes(a.id)} onChange={() => setAddonIds((l) => toggle(l, a.id))} />
                        <span className="shrink-0 text-sm text-cobre-300">+ {formatBRL(a.price)}</span>
                      </div>
                    ))}
                </div>
              </fieldset>
            )}

            <TextareaField label="Observações" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={200} placeholder="Ex.: carne ao ponto" hint={`${notes.length}/200`} />

            <div className="flex flex-wrap items-center gap-4 border-t border-carvao-600 pt-6">
              <QuantityStepper value={quantity} onChange={setQuantity} label={product.name} />
              <Button size="lg" className="flex-1" onClick={submit} icon={<Check className="size-5" aria-hidden />}>
                {editingLine ? "Salvar alterações" : "Adicionar ao carrinho"}
              </Button>
            </div>
            <p className="-mt-3 text-xs text-fumaca">Total estimado: {formatBRL(estimate)}. O valor final é conferido pelo servidor antes de registrar o pedido.</p>
          </div>
        )}
      </div>
    </div>
  );
}
