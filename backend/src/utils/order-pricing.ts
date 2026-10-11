// Cálculo oficial de valores. O servidor é a única fonte: nenhum total vindo do navegador é lido.
// Tudo em centavos inteiros (sem ponto flutuante).

export const MAX_INT32 = 2_147_483_647; // limite da coluna INTEGER do PostgreSQL

export interface PricedExtra {
  unitPriceCents: number;
  quantity: number;
}

export interface PricedLine {
  unitPriceCents: number;
  quantity: number;
  extras: PricedExtra[];
}

// (preço do produto + adicionais) × quantidade
export function computeLineTotal(line: PricedLine): number {
  const extrasPerUnit = line.extras.reduce((sum, e) => sum + e.unitPriceCents * e.quantity, 0);
  return (line.unitPriceCents + extrasPerUnit) * line.quantity;
}

export interface OrderTotals {
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
}

export function computeOrderTotals(lineTotals: number[], deliveryFeeCents: number): OrderTotals {
  const subtotalCents = lineTotals.reduce((sum, v) => sum + v, 0);
  const totalCents = subtotalCents + deliveryFeeCents;
  const ok = [subtotalCents, deliveryFeeCents, totalCents].every(
    (v) => Number.isSafeInteger(v) && v >= 0 && v <= MAX_INT32,
  );
  if (!ok) throw new RangeError('Valores do pedido fora do limite permitido');
  return { subtotalCents, deliveryFeeCents, totalCents };
}
