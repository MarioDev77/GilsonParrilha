import { describe, expect, it } from 'vitest';
import { computeLineTotal, computeOrderTotals, MAX_INT32 } from '../../src/utils/order-pricing';
import { formatBRL } from '../../src/utils/money';

describe('computeLineTotal', () => {
  it('soma produto + adicionais e multiplica pela quantidade', () => {
    // (3290 + 400 + 2×250) × 2 = 8380
    const total = computeLineTotal({
      unitPriceCents: 3290,
      quantity: 2,
      extras: [
        { unitPriceCents: 400, quantity: 1 },
        { unitPriceCents: 250, quantity: 2 },
      ],
    });
    expect(total).toBe(8380);
  });

  it('funciona sem adicionais', () => {
    expect(computeLineTotal({ unitPriceCents: 1500, quantity: 3, extras: [] })).toBe(4500);
  });

  it('não sofre erro de ponto flutuante (tudo inteiro)', () => {
    expect(computeLineTotal({ unitPriceCents: 1099, quantity: 3, extras: [{ unitPriceCents: 1, quantity: 1 }] })).toBe(3300);
  });
});

describe('computeOrderTotals', () => {
  it('total = subtotal + taxa de entrega', () => {
    expect(computeOrderTotals([8380, 1500], 600)).toEqual({ subtotalCents: 9880, deliveryFeeCents: 600, totalCents: 10480 });
  });

  it('retirada: taxa zero', () => {
    expect(computeOrderTotals([2000], 0).totalCents).toBe(2000);
  });

  it('rejeita valores acima do limite do INTEGER do PostgreSQL', () => {
    expect(() => computeOrderTotals([MAX_INT32], 1)).toThrow();
  });

  it('rejeita valores negativos ou não inteiros', () => {
    expect(() => computeOrderTotals([-1], 0)).toThrow();
    expect(() => computeOrderTotals([10.5], 0)).toThrow();
  });
});

describe('formatBRL', () => {
  it('formata centavos em reais', () => {
    expect(formatBRL(0)).toBe('R$ 0,00');
    expect(formatBRL(5)).toBe('R$ 0,05');
    expect(formatBRL(3290)).toBe('R$ 32,90');
    expect(formatBRL(123456)).toBe('R$ 1.234,56');
    expect(formatBRL(100000000)).toBe('R$ 1.000.000,00');
  });
});
