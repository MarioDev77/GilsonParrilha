"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { OrderLines, Totals } from "@/components/checkout/OrderSummary";
import { Button, buttonClass } from "@/components/ui/Button";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { TextareaField } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { OrderStatusBadge } from "@/components/ui/OrderStatusBadge";
import { ErrorState, LoadingState } from "@/components/ui/States";
import { POLL_INTERVAL_MS } from "@/config/site";
import { useAsync } from "@/hooks/useAsync";
import { errorMessage } from "@/services/http";
import { ordersService } from "@/services/orders";
import type { AdminOrderDetail, OrderStatus } from "@/types";
import { formatDateTime, formatPhone, onlyDigits } from "@/utils/format";
import { ORDER_STATUS_LABEL } from "@/utils/orderStatus";
import { waLink } from "@/utils/whatsapp";

function customerWhatsApp(order: AdminOrderDetail): string {
  const digits = onlyDigits(order.customerPhone);
  const full = digits.length <= 11 ? `55${digits}` : digits;
  return waLink(full, `Olá, ${order.customerName}! Aqui é da Gilson Parrilha sobre o seu pedido #${order.number}.`);
}

function Detail({ orderId, onChanged }: { orderId: string; onChanged: () => void }) {
  const { data: order, loading, error, reload, setData } = useAsync((s) => ordersService.adminGet(orderId, s), [orderId], { refreshMs: POLL_INTERVAL_MS });
  const [notes, setNotes] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    if (order && !notesDirty) setNotes(order.internalNotes ?? "");
  }, [order, notesDirty]);

  if (loading && !order) return <LoadingState label="Carregando pedido…" />;
  if (error && !order) return <ErrorState error={error} onRetry={reload} />;
  if (!order) return null;

  const apply = (updated: AdminOrderDetail) => {
    setData(updated);
    onChanged();
  };

  async function changeStatus(status: OrderStatus, reason?: string) {
    setBusy(status);
    try {
      apply(await ordersService.changeStatus(orderId, status, reason));
      toast.success(`Pedido atualizado: ${ORDER_STATUS_LABEL[status]}`);
      setCancelOpen(false);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function saveNotes() {
    setBusy("notes");
    try {
      apply(await ordersService.saveInternalNotes(orderId, notes.trim()));
      setNotesDirty(false);
      toast.success("Observação interna salva");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  const forward = order.allowedTransitions.filter((s) => s !== "cancelled");
  const canCancel = order.allowedTransitions.includes("cancelled");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <OrderStatusBadge status={order.status} />
        <span className="text-xs text-fumaca">Registrado em {formatDateTime(order.createdAt)}</span>
      </div>

      <section aria-label="Cliente" className="space-y-1 text-sm">
        <p className="text-lg font-bold">{order.customerName}</p>
        <p className="text-fumaca">{formatPhone(order.customerPhone)}</p>
        <a href={customerWhatsApp(order)} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm", "mt-2")}>
          <MessageCircle className="size-4" aria-hidden /> Conversar no WhatsApp
          <span className="sr-only">(abre em nova aba)</span>
        </a>
      </section>

      <section aria-label="Itens">
        <OrderLines items={order.items} />
        <div className="mt-3">
          <Totals subtotal={order.subtotal} deliveryFee={order.deliveryFee} total={order.total} showFee={order.fulfillment === "delivery"} />
        </div>
      </section>

      <section aria-label="Entrega" className="space-y-1 text-sm">
        <p>
          <span className="text-fumaca">Atendimento: </span>
          <strong>{order.fulfillment === "delivery" ? "Entrega" : "Retirada no local"}</strong>
        </p>
        {order.address && (
          <p>
            <span className="text-fumaca">Endereço: </span>
            {order.address.street}, {order.address.number}
            {order.address.complement ? ` - ${order.address.complement}` : ""}, {order.address.district}, {order.address.city}
          </p>
        )}
        {order.reference && (
          <p>
            <span className="text-fumaca">Referência: </span>
            {order.reference}
          </p>
        )}
        {order.notes && (
          <p>
            <span className="text-fumaca">Observações do cliente: </span>
            {order.notes}
          </p>
        )}
        {order.cancelReason && (
          <p className="text-red-300">
            <span>Motivo do cancelamento: </span>
            {order.cancelReason}
          </p>
        )}
      </section>

      <section aria-label="Observação interna" className="space-y-2">
        <TextareaField
          label="Observação interna (o cliente não vê)"
          value={notes}
          maxLength={500}
          onChange={(e) => {
            setNotes(e.target.value);
            setNotesDirty(true);
          }}
        />
        <Button size="sm" variant="secondary" onClick={saveNotes} loading={busy === "notes"} disabled={!notesDirty}>
          Salvar observação
        </Button>
      </section>

      {(forward.length > 0 || canCancel) && (
        <section aria-label="Alterar status" className="space-y-3 border-t border-carvao-600 pt-5">
          <h3 className="font-display text-2xl font-bold">Alterar status</h3>
          <div className="flex flex-wrap gap-2">
            {forward.map((s) => (
              <Button key={s} loading={busy === s} disabled={busy !== null} onClick={() => changeStatus(s)}>
                {ORDER_STATUS_LABEL[s]}
              </Button>
            ))}
            {canCancel && (
              <Button variant="danger" disabled={busy !== null} onClick={() => setCancelOpen(true)}>
                Cancelar pedido
              </Button>
            )}
          </div>
        </section>
      )}

      <ConfirmationDialog
        open={cancelOpen}
        danger
        title="Cancelar pedido"
        description={`O pedido #${order.number} será marcado como cancelado. Informe o motivo para o histórico.`}
        reasonLabel="Motivo do cancelamento"
        confirmLabel="Cancelar pedido"
        loading={busy === "cancelled"}
        onConfirm={(reason) => changeStatus("cancelled", reason)}
        onCancel={() => setCancelOpen(false)}
      />
    </div>
  );
}

export function OrderDetailModal({ orderId, onClose, onChanged }: { orderId: string | null; onClose: () => void; onChanged: () => void }) {
  return (
    <Modal open={!!orderId} onClose={onClose} title="Detalhes do pedido" variant="drawer">
      {orderId && <Detail orderId={orderId} onChanged={onChanged} />}
    </Modal>
  );
}
