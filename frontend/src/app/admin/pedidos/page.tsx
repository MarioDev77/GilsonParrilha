"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Receipt } from "lucide-react";
import { OrderDetailModal } from "@/components/admin/OrderDetail";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { POLL_INTERVAL_MS } from "@/config/site";
import { useAsync } from "@/hooks/useAsync";
import { useDebounce } from "@/hooks/useDebounce";
import { ordersService } from "@/services/orders";
import type { OrderStatus } from "@/types";
import { ALL_STATUSES, ORDER_STATUS_LABEL } from "@/utils/orderStatus";

const PAGE_SIZE = 20;

export default function OrdersPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<OrderStatus | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const debouncedQ = useDebounce(q, 350);

  const { data, loading, error, reload } = useAsync(
    (s) => ordersService.adminList({ q: debouncedQ.trim(), status, dateFrom, dateTo, page, pageSize: PAGE_SIZE }, s),
    [debouncedQ, status, dateFrom, dateTo, page],
    { refreshMs: POLL_INTERVAL_MS }
  );

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const filtered = !!(debouncedQ || status || dateFrom || dateTo);
  const resetPage = () => setPage(1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-5xl font-black">Pedidos</h1>
        <p className="text-xs text-fumaca">A lista é atualizada automaticamente a cada {POLL_INTERVAL_MS / 1000} segundos.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TextField label="Buscar por número ou cliente" value={q} onChange={(e) => { setQ(e.target.value); resetPage(); }} />
        <SelectField label="Status" value={status} onChange={(e) => { setStatus(e.target.value as OrderStatus | ""); resetPage(); }}>
          <option value="">Todos</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABEL[s]}
            </option>
          ))}
        </SelectField>
        <TextField label="De" type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); resetPage(); }} />
        <TextField label="Até" type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); resetPage(); }} />
      </div>

      {loading && !data ? (
        <LoadingState label="Carregando pedidos…" />
      ) : error && !data ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data && data.items.length === 0 ? (
        <EmptyState
          icon={<Receipt className="size-9" aria-hidden />}
          title={filtered ? "Nenhum pedido com esses filtros" : "Ainda não há pedidos"}
          description={filtered ? "Ajuste a busca, o status ou as datas." : "Os pedidos aparecem aqui assim que forem registrados."}
        />
      ) : data ? (
        <>
          <OrdersTable orders={data.items} onOpen={setOpenId} />
          <div className="flex items-center justify-between gap-3 text-sm text-fumaca">
            <span>
              {data.total} {data.total === 1 ? "pedido" : "pedidos"} · página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} icon={<ChevronLeft className="size-4" aria-hidden />}>
                Anterior
              </Button>
              <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Próxima <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        </>
      ) : null}

      <OrderDetailModal orderId={openId} onClose={() => setOpenId(null)} onChanged={reload} />
    </div>
  );
}
