"use client";

import { useState } from "react";
import { DashboardCards } from "@/components/admin/DashboardCards";
import { OrdersChart } from "@/components/admin/OrdersChart";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { SelectField } from "@/components/ui/Field";
import { useAsync } from "@/hooks/useAsync";
import { dashboardService } from "@/services/dashboard";

export default function DashboardPage() {
  const [days, setDays] = useState(7);
  const { data, loading, error, reload } = useAsync((s) => dashboardService.get(days, s), [days], { refreshMs: 30_000 });

  const maxQty = Math.max(1, ...(data?.topProducts.map((p) => p.quantity) ?? [1]));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-5xl font-black">Dashboard</h1>
        <SelectField label="Período" value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-44">
          <option value={7}>Últimos 7 dias</option>
          <option value={14}>Últimos 14 dias</option>
          <option value={30}>Últimos 30 dias</option>
        </SelectField>
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4" role="status" aria-label="Carregando indicadores">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : error && !data ? (
        <ErrorState error={error} onRetry={reload} />
      ) : data ? (
        <>
          <DashboardCards data={data} />
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <section className="rounded-sm border border-carvao-600 bg-carvao-800 p-5" aria-labelledby="chart-t">
              <h2 id="chart-t" className="mb-4 text-3xl font-bold">
                Pedidos por dia
              </h2>
              <OrdersChart data={data.ordersByPeriod} />
            </section>
            <section className="rounded-sm border border-carvao-600 bg-carvao-800 p-5" aria-labelledby="top-t">
              <h2 id="top-t" className="mb-4 text-3xl font-bold">
                Mais pedidos
              </h2>
              {data.topProducts.length === 0 ? (
                <EmptyState title="Sem dados ainda" description="Os produtos mais pedidos aparecem aqui." />
              ) : (
                <ol className="space-y-3">
                  {data.topProducts.slice(0, 6).map((p) => (
                    <li key={p.name}>
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="truncate font-medium">{p.name}</span>
                        <span className="shrink-0 text-fumaca">{p.quantity}</span>
                      </div>
                      <div className="mt-1 h-1.5 bg-carvao-700">
                        <div className="h-full bg-cobre" style={{ width: `${(p.quantity / maxQty) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
