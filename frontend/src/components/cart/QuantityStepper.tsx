import { Minus, Plus } from "lucide-react";
import { MAX_LINE_QUANTITY } from "@/context/CartContext";

export function QuantityStepper({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div role="group" aria-label={`Quantidade de ${label}`} className="inline-flex items-center rounded-sm ring-1 ring-inset ring-carvao-600">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label={`Diminuir quantidade de ${label}`}
        className="grid size-10 place-items-center text-osso hover:bg-carvao-700 disabled:opacity-40"
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <span className="min-w-8 text-center text-[15px] font-bold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= MAX_LINE_QUANTITY}
        aria-label={`Aumentar quantidade de ${label}`}
        className="grid size-10 place-items-center text-osso hover:bg-carvao-700 disabled:opacity-40"
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}
