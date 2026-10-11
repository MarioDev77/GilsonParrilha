import type { OrderWithItems } from '../repositories/order.repository';

// Lista branca de campos. Nada interno (notas internas, hash, chave de idempotência, ids internos,
// telefone, endereço) vai para a resposta pública.

function mapItems(order: OrderWithItems) {
  return order.items.map((item) => ({
    productName: item.productName,
    quantity: item.quantity,
    unitPriceCents: item.unitPriceCents,
    removedIngredients: item.removedIngredients,
    notes: item.notes,
    extras: item.extras.map((e) => ({ name: e.name, quantity: e.quantity, unitPriceCents: e.unitPriceCents })),
    lineTotalCents: item.lineTotalCents,
  }));
}

function mapTotals(order: OrderWithItems) {
  return {
    subtotalCents: order.subtotalCents,
    deliveryFeeCents: order.deliveryFeeCents,
    totalCents: order.totalCents,
  };
}

// Resposta da CRIAÇÃO (quem acabou de criar pode ver o que enviou).
export function toCreatedOrder(order: OrderWithItems, estimatedPrepMinutes: number) {
  return {
    publicId: order.publicId,
    orderNumber: order.orderNumber,
    status: order.status,
    customerName: order.customerName,
    fulfillmentType: order.fulfillmentType,
    deliveryAddress: order.deliveryAddress,
    deliveryReference: order.deliveryReference,
    customerNotes: order.customerNotes,
    items: mapItems(order),
    ...mapTotals(order),
    outsideBusinessHours: order.outsideBusinessHours,
    estimatedPrepMinutes,
    createdAt: order.createdAt,
  };
}

// Resposta da CONSULTA PÚBLICA: mínimo necessário. Só o primeiro nome; sem telefone nem endereço.
export function toPublicOrderSummary(order: OrderWithItems, estimatedPrepMinutes: number) {
  const firstName = order.customerName.split(' ')[0] ?? '';
  return {
    publicId: order.publicId,
    orderNumber: order.orderNumber,
    status: order.status,
    customerFirstName: firstName,
    fulfillmentType: order.fulfillmentType,
    items: mapItems(order),
    ...mapTotals(order),
    outsideBusinessHours: order.outsideBusinessHours,
    estimatedPrepMinutes,
    createdAt: order.createdAt,
    confirmedAt: order.confirmedAt,
    completedAt: order.completedAt,
    cancelledAt: order.cancelledAt,
  };
}
