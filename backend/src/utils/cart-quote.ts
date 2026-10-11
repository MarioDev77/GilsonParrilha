import { formatBRL } from './money';
import { computeOrderTotals } from './order-pricing';
import {
  describeItemIssue,
  resolveOrderItems,
  type OrderItemRequest,
  type ProductForOrder,
} from './order-items';

export type FulfillmentType = 'DELIVERY' | 'PICKUP';

export interface QuoteSettings {
  acceptsDelivery: boolean;
  acceptsPickup: boolean;
  deliveryFeeCents: number;
  minOrderCents: number;
  acceptOrdersOutsideHours: boolean;
}

export interface QuoteLine {
  index: number;
  productId: string;
  /** `null` quando o produto não existe mais ou não pode ser pedido. */
  name: string | null;
  imageUrl: string | null;
  available: boolean;
  quantity: number;
  unitPriceCents: number;
  extras: { extraId: string; name: string; unitPriceCents: number; quantity: number }[];
  removedIngredients: string[];
  notes: string | null;
  lineTotalCents: number;
  issue: string | null;
}

export interface CartQuote {
  lines: QuoteLine[];
  subtotalCents: number;
  /** `null` enquanto a modalidade (entrega/retirada) não foi escolhida. */
  deliveryFeeCents: number | null;
  totalCents: number;
  minOrderCents: number;
  canCheckout: boolean;
  /** Problemas que bloqueiam o pedido, em linguagem para o cliente. */
  issues: string[];
  isOpenNow: boolean;
  outsideBusinessHours: boolean;
}

// Mesmas regras de criação de pedido, mas SEM gravar nada e SEM lançar erro de regra:
// os problemas voltam na resposta para a tela do carrinho explicar ao cliente.
export function buildCartQuote(params: {
  items: OrderItemRequest[];
  fulfillmentType?: FulfillmentType | undefined;
  products: Map<string, ProductForOrder>;
  settings: QuoteSettings;
  isOpenNow: boolean;
}): CartQuote {
  const { items, fulfillmentType, products, settings, isOpenNow } = params;
  const { lines, issues: itemIssues } = resolveOrderItems(items, products);

  const issues: string[] = [];

  const quoteLines: QuoteLine[] = items.map((item, index) => {
    const resolved = lines[index] ?? null;
    const own = itemIssues.filter((i) => i.itemIndex === index);
    const messages = own.map((i) => describeItemIssue(i, resolved?.productName ?? null));
    issues.push(...messages);

    return {
      index,
      productId: item.productId,
      name: resolved?.productName ?? null,
      imageUrl: resolved?.imageUrl ?? null,
      available: resolved !== null,
      quantity: item.quantity,
      unitPriceCents: resolved?.unitPriceCents ?? 0,
      extras: resolved?.extras ?? [],
      removedIngredients: resolved?.removedIngredients ?? [],
      notes: resolved?.notes ?? null,
      lineTotalCents: resolved?.lineTotalCents ?? 0,
      issue: messages[0] ?? null,
    };
  });

  const isDelivery = fulfillmentType === 'DELIVERY';
  if (fulfillmentType) {
    const accepted = isDelivery ? settings.acceptsDelivery : settings.acceptsPickup;
    if (!accepted) {
      issues.push(isDelivery ? 'A loja não está aceitando entregas no momento.' : 'A loja não está aceitando retiradas no momento.');
    }
  } else if (!settings.acceptsDelivery && !settings.acceptsPickup) {
    issues.push('A loja não está aceitando pedidos no momento.');
  }

  if (!isOpenNow && !settings.acceptOrdersOutsideHours) {
    issues.push('A loja está fechada no momento e não aceita pedidos fora do horário.');
  }

  const deliveryFeeCents = fulfillmentType ? (isDelivery ? settings.deliveryFeeCents : 0) : null;

  let subtotalCents = 0;
  let totalCents = 0;
  try {
    const totals = computeOrderTotals(
      quoteLines.map((l) => l.lineTotalCents),
      deliveryFeeCents ?? 0,
    );
    subtotalCents = totals.subtotalCents;
    totalCents = totals.totalCents;
  } catch {
    issues.push('Pedido grande demais. Reduza a quantidade de itens.');
  }

  // Pedido mínimo considera o subtotal (sem a taxa de entrega), como na criação do pedido.
  if (subtotalCents < settings.minOrderCents) {
    issues.push(`O pedido mínimo é de ${formatBRL(settings.minOrderCents)} em itens.`);
  }

  return {
    lines: quoteLines,
    subtotalCents,
    deliveryFeeCents,
    totalCents,
    minOrderCents: settings.minOrderCents,
    canCheckout: issues.length === 0,
    issues,
    isOpenNow,
    outsideBusinessHours: !isOpenNow,
  };
}
