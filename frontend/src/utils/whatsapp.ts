import type { Fulfillment, PublicOrder } from "@/types";
import { formatBRL, onlyDigits } from "./format";

export function waLink(phone: string, message?: string): string {
  const digits = onlyDigits(phone);
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

const FULFILLMENT_LABEL: Record<Fulfillment, string> = { delivery: "Entrega", pickup: "Retirada" };

/** Mensagem de reserva, montada só com dados devolvidos pelo backend (usada se ele não enviar a mensagem pronta). */
export function buildOrderMessage(order: PublicOrder): string {
  const lines: string[] = [`Olá! Quero finalizar o pedido #${order.number}.`, ""];
  for (const item of order.items) {
    lines.push(`${item.quantity}x ${item.name} — ${formatBRL(item.subtotal)}`);
    if (item.addons.length) lines.push(`   Adicionais: ${item.addons.map((a) => a.name).join(", ")}`);
    if (item.removedIngredients.length) lines.push(`   Sem: ${item.removedIngredients.join(", ")}`);
    if (item.notes) lines.push(`   Obs.: ${item.notes}`);
  }
  lines.push("");
  lines.push(`Atendimento: ${FULFILLMENT_LABEL[order.fulfillment]}`);
  if (order.fulfillment === "delivery" && order.address) {
    const a = order.address;
    lines.push(`Endereço: ${a.street}, ${a.number}${a.complement ? ` - ${a.complement}` : ""}, ${a.district}, ${a.city}`);
    if (order.reference) lines.push(`Referência: ${order.reference}`);
  }
  if (order.notes) lines.push(`Observações: ${order.notes}`);
  if (order.fulfillment === "delivery") lines.push(`Entrega: ${formatBRL(order.deliveryFee)}`);
  lines.push(`Total: ${formatBRL(order.total)}`);
  lines.push(`Nome: ${order.customerName}`);
  return lines.join("\n");
}

export function resolveWhatsAppUrl(order: PublicOrder, businessWhatsapp: string | undefined): string | null {
  if (order.whatsappUrl) return order.whatsappUrl;
  if (!businessWhatsapp) return null;
  return waLink(businessWhatsapp, order.whatsappMessage || buildOrderMessage(order));
}
