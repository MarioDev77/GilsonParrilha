import { formatBRL } from './money';

export interface WhatsappOrderExtra {
  name: string;
  unitPriceCents: number;
  quantity: number;
}

export interface WhatsappOrderItem {
  productName: string;
  quantity: number;
  lineTotalCents: number;
  removedIngredients: string[];
  notes: string | null;
  extras: WhatsappOrderExtra[];
}

export interface WhatsappOrder {
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  fulfillmentType: 'DELIVERY' | 'PICKUP';
  deliveryAddress: string | null;
  deliveryReference: string | null;
  customerNotes: string | null;
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  outsideBusinessHours: boolean;
  items: WhatsappOrderItem[];
}

// Acima disso a URL pode ser truncada por navegadores/apps; usamos a versão compacta.
const MAX_ENCODED_TEXT_LENGTH = 3000;

function formatPhone(digits: string): string {
  const m = /^55(\d{2})(\d{4,5})(\d{4})$/.exec(digits);
  return m ? `(${m[1]}) ${m[2]}-${m[3]}` : `+${digits}`;
}

function fulfillmentLabel(type: WhatsappOrder['fulfillmentType']): string {
  return type === 'DELIVERY' ? 'Entrega' : 'Retirada';
}

function itemLines(item: WhatsappOrderItem): string[] {
  const lines = [`${item.quantity}x ${item.productName} — ${formatBRL(item.lineTotalCents)}`];
  for (const extra of item.extras) {
    const qty = extra.quantity > 1 ? `${extra.quantity}x ` : '';
    lines.push(`   + ${qty}${extra.name} (${formatBRL(extra.unitPriceCents * extra.quantity)})`);
  }
  if (item.removedIngredients.length > 0) lines.push(`   Sem: ${item.removedIngredients.join(', ')}`);
  if (item.notes) lines.push(`   Obs.: ${item.notes}`);
  return lines;
}

function totalsLines(order: WhatsappOrder): string[] {
  const lines = [`Subtotal: ${formatBRL(order.subtotalCents)}`];
  if (order.fulfillmentType === 'DELIVERY') lines.push(`Taxa de entrega: ${formatBRL(order.deliveryFeeCents)}`);
  lines.push(`*Total: ${formatBRL(order.totalCents)}*`);
  return lines;
}

const OUTSIDE_HOURS_NOTE = 'Pedido feito fora do horário de atendimento: depende de confirmação da equipe.';

export function buildOrderMessage(tradeName: string, order: WhatsappOrder): string {
  const out: string[] = [
    `*${tradeName}* — Pedido #${order.orderNumber}`,
    '',
    `Cliente: ${order.customerName}`,
    `Telefone: ${formatPhone(order.customerPhone)}`,
    `Atendimento: ${fulfillmentLabel(order.fulfillmentType)}`,
  ];
  if (order.fulfillmentType === 'DELIVERY') {
    out.push(`Endereço: ${order.deliveryAddress ?? ''}`);
    if (order.deliveryReference) out.push(`Referência: ${order.deliveryReference}`);
  }
  out.push('', '*Itens*');
  for (const item of order.items) out.push(...itemLines(item));
  if (order.customerNotes) out.push('', `Observações: ${order.customerNotes}`);
  out.push('', ...totalsLines(order));
  if (order.outsideBusinessHours) out.push('', OUTSIDE_HOURS_NOTE);
  return out.join('\n');
}

// Versão curta para pedidos enormes: a equipe consulta os itens pelo número do pedido no painel.
export function buildCompactOrderMessage(tradeName: string, order: WhatsappOrder): string {
  const count = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const out: string[] = [
    `*${tradeName}* — Pedido #${order.orderNumber}`,
    `Cliente: ${order.customerName}`,
    `Atendimento: ${fulfillmentLabel(order.fulfillmentType)}`,
    `Itens: ${count} (detalhes no sistema, pelo número do pedido)`,
    ...totalsLines(order),
  ];
  if (order.outsideBusinessHours) out.push('', OUTSIDE_HOURS_NOTE);
  return out.join('\n');
}

// Link oficial de conversa: https://wa.me/<número só com dígitos e DDI>?text=<mensagem codificada>
export function buildWhatsappUrl(number: string, message: string): string {
  if (!/^\d{11,15}$/.test(number)) throw new Error('Número de WhatsApp inválido');
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function buildWhatsappLink(
  tradeName: string,
  number: string,
  order: WhatsappOrder,
): { url: string; message: string } {
  let message = buildOrderMessage(tradeName, order);
  if (encodeURIComponent(message).length > MAX_ENCODED_TEXT_LENGTH) {
    message = buildCompactOrderMessage(tradeName, order);
  }
  return { url: buildWhatsappUrl(number, message), message };
}
