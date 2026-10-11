import { formatBRL } from "@/utils/format";
import type { DashboardData, OrderStatus } from "@/types";
import { ORDER_STATUS_SHORT } from "@/utils/orderStatus";
import { cn } from "@/utils/cn";

const STATUS_CARDS: OrderStatus[] = ["awaiting_whatsapp", "confirmed", "preparing", "ready", "completed", "cancelled"];

function Card({ label, value, note, emphasis }: { label: string; value: string | number; note?: string; emphasis?: boolean }) {
  return (
    <div className={cn("rounded-sm border bg-carvao-800 p-4", emphasis ? "border-cobre/60" : "border-carvao-600")}>
      <p className="text-sm text-fumaca">{label}</p>
      <p className={cn("mt-1 font-display text-5xl font-black leading-none", emphasis && "text-cobre-300")}>{value}</p>
      {note && <p className="mt-2 text-xs text-fumaca">{note}</p>}
    </div>
  );
}

export function DashboardCards({ data }: { data: DashboardData }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Card label="Pedidos do dia" value={data.ordersToday} emphasis />
      {STATUS_CARDS.map((s) => (
        <Card key={s} label={ORDER_STATUS_SHORT[s]} value={data.byStatus[s] ?? 0} />
      ))}
      <Card
        label="Faturamento"
        value={formatBRL(data.revenue)}
        note={data.revenueCriterion ?? "Somente pedidos concluídos. Pedidos apenas registrados não entram."}
        emphasis
      />
    </div>
  );
}
