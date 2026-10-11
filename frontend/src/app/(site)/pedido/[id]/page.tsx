"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { WhatsAppOrderButton } from "@/components/checkout/WhatsAppOrderButton";
import { OrderLines, Totals } from "@/components/checkout/OrderSummary";
import { buttonClass } from "@/components/ui/Button";
import { OrderStatusBadge } from "@/components/ui/OrderStatusBadge";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { ORDER_STORAGE_PREFIX } from "@/config/site";
import { useSettings } from "@/context/SettingsContext";
import type { PublicOrder } from "@/types";

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const { settings } = useSettings();
  const [order, setOrder] = useState<PublicOrder | null | undefined>(undefined);

  // O resumo vem da resposta da API guardada só nesta sessão do navegador, para exibir a tela final.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(ORDER_STORAGE_PREFIX + id);
      setOrder(raw ? (JSON.parse(raw) as PublicOrder) : null);
    } catch {
      setOrder(null);
    }
  }, [id]);

  if (order === undefined) return <LoadingState label="Carregando pedido…" />;

  if (order === null) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <EmptyState
          title="Não encontramos o resumo deste pedido"
          description="Por segurança, o resumo fica disponível só no aparelho e na sessão em que o pedido foi feito. Se você já registrou o pedido, fale com a hamburgueria informando o número."
          action={
            <Link href="/cardapio" className={buttonClass("primary")}>
              Ver cardápio
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-5xl font-black">Pedido #{order.number}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <OrderStatusBadge status={order.status} />
        <span className="text-sm text-fumaca">Pedido registrado, mas ainda não confirmado pela equipe.</span>
      </div>

      <section className="mt-8 rounded-sm border border-carvao-600 bg-carvao-800 p-5" aria-label="Resumo do pedido">
        <OrderLines items={order.items} />
        <div className="mt-4">
          <Totals subtotal={order.subtotal} deliveryFee={order.deliveryFee} total={order.total} showFee={order.fulfillment === "delivery"} />
        </div>
        <dl className="mt-5 grid gap-3 border-t border-carvao-600 pt-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-fumaca">Atendimento</dt>
            <dd className="font-semibold">{order.fulfillment === "delivery" ? "Entrega" : "Retirada no local"}</dd>
          </div>
          {order.fulfillment === "delivery" && order.address && (
            <div>
              <dt className="text-fumaca">Endereço</dt>
              <dd className="font-semibold">
                {order.address.street}, {order.address.number}
                {order.address.complement ? ` - ${order.address.complement}` : ""}, {order.address.district}, {order.address.city}
              </dd>
            </div>
          )}
        </dl>
      </section>

      <div className="mt-8">
        <WhatsAppOrderButton order={order} businessWhatsapp={settings?.whatsapp} />
      </div>

      <Link href="/cardapio" className="mt-8 inline-block text-sm text-fumaca hover:text-osso">
        Voltar ao cardápio
      </Link>
    </div>
  );
}
