import type { OrderLineView } from "@/types";
import { formatBRL } from "@/utils/format";

export function OrderLines({ items }: { items: OrderLineView[] }) {
  return (
    <ul className="divide-y divide-carvao-600">
      {items.map((it, i) => (
        <li key={i} className="flex justify-between gap-4 py-3 text-sm">
          <div>
            <p className="font-semibold">
              {it.quantity}x {it.name}
            </p>
            {it.addons.length > 0 && <p className="text-xs text-fumaca">Adicionais: {it.addons.map((a) => a.name).join(", ")}</p>}
            {it.removedIngredients.length > 0 && <p className="text-xs text-fumaca">Sem: {it.removedIngredients.join(", ")}</p>}
            {it.notes && <p className="text-xs text-fumaca">Obs.: {it.notes}</p>}
          </div>
          <span className="shrink-0 text-cobre-300">{formatBRL(it.subtotal)}</span>
        </li>
      ))}
    </ul>
  );
}

export function Totals({ subtotal, deliveryFee, total, showFee }: { subtotal: number; deliveryFee: number | null; total: number; showFee: boolean }) {
  return (
    <dl className="space-y-1.5 text-sm">
      <div className="flex justify-between text-fumaca">
        <dt>Subtotal</dt>
        <dd>{formatBRL(subtotal)}</dd>
      </div>
      {showFee && (
        <div className="flex justify-between text-fumaca">
          <dt>Entrega</dt>
          <dd>{formatBRL(deliveryFee ?? 0)}</dd>
        </div>
      )}
      <div className="flex justify-between border-t border-carvao-600 pt-2 text-lg font-bold">
        <dt>Total</dt>
        <dd className="text-cobre-300">{formatBRL(total)}</dd>
      </div>
    </dl>
  );
}
