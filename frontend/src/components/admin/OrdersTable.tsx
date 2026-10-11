import type { AdminOrderSummary } from "@/types";
import { formatBRL, formatDateTime, formatPhone } from "@/utils/format";
import { OrderStatusBadge } from "@/components/ui/OrderStatusBadge";
import { Button } from "@/components/ui/Button";

export function OrdersTable({ orders, onOpen }: { orders: AdminOrderSummary[]; onOpen: (id: string) => void }) {
  return (
    <div className="overflow-x-auto rounded-sm border border-carvao-600">
      <table className="w-full min-w-[720px] text-left text-sm">
        <caption className="sr-only">Lista de pedidos</caption>
        <thead className="bg-carvao-800 text-fumaca">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Nº</th>
            <th scope="col" className="px-4 py-3 font-medium">Cliente</th>
            <th scope="col" className="px-4 py-3 font-medium">Atendimento</th>
            <th scope="col" className="px-4 py-3 font-medium">Total</th>
            <th scope="col" className="px-4 py-3 font-medium">Status</th>
            <th scope="col" className="px-4 py-3 font-medium">Data</th>
            <th scope="col" className="px-4 py-3"><span className="sr-only">Ações</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-carvao-600">
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-carvao-800/60">
              <td className="px-4 py-3 font-bold">#{o.number}</td>
              <td className="px-4 py-3">
                <p className="font-medium">{o.customerName}</p>
                <p className="text-xs text-fumaca">{formatPhone(o.customerPhone)}</p>
              </td>
              <td className="px-4 py-3">{o.fulfillment === "delivery" ? "Entrega" : "Retirada"}</td>
              <td className="px-4 py-3 text-cobre-300">{formatBRL(o.total)}</td>
              <td className="px-4 py-3">
                <OrderStatusBadge status={o.status} short />
              </td>
              <td className="px-4 py-3 text-fumaca">{formatDateTime(o.createdAt)}</td>
              <td className="px-4 py-3 text-right">
                <Button size="sm" variant="secondary" onClick={() => onOpen(o.id)} aria-label={`Ver detalhes do pedido ${o.number}`}>
                  Detalhes
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
