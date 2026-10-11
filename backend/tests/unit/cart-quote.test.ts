import { describe, expect, it } from 'vitest';
import { quoteSchema } from '../../src/schemas/order.schema';
import { buildCartQuote, type QuoteSettings } from '../../src/utils/cart-quote';
import { resolveOrderItems, type ProductForOrder } from '../../src/utils/order-items';

const P1 = '11111111-1111-4111-8111-111111111111';
const P2 = '22222222-2222-4222-8222-222222222222';
const X1 = '33333333-3333-4333-8333-333333333333';
const X2 = '44444444-4444-4444-8444-444444444444';

const bacon = { id: X1, name: 'Bacon extra', priceCents: 500, isActive: true, isAvailable: true, archivedAt: null };
const offExtra = { id: X2, name: 'Queijo extra', priceCents: 400, isActive: true, isAvailable: false, archivedAt: null };

function products(): Map<string, ProductForOrder> {
  const burger: ProductForOrder = {
    id: P1,
    name: 'X-Bacon',
    priceCents: 3000,
    imageUrl: '/img/x-bacon.jpg',
    isAvailable: true,
    removableIngredients: ['Cebola', 'Picles'],
    extras: [{ extra: bacon }, { extra: offExtra }],
  };
  const gone: ProductForOrder = { ...burger, id: P2, name: 'Esgotado', isAvailable: false, extras: [] };
  return new Map([
    [burger.id, burger],
    [gone.id, gone],
  ]);
}

const settings: QuoteSettings = {
  acceptsDelivery: true,
  acceptsPickup: true,
  deliveryFeeCents: 800,
  minOrderCents: 2000,
  acceptOrdersOutsideHours: false,
};

const item = (over: Partial<Parameters<typeof buildCartQuote>[0]['items'][number]> = {}) => ({
  productId: P1,
  quantity: 1,
  extras: [],
  removedIngredients: [],
  ...over,
});

describe('resolveOrderItems', () => {
  it('calcula (produto + adicionais) × quantidade e usa o nome oficial do ingrediente', () => {
    const { lines, issues } = resolveOrderItems(
      [item({ quantity: 2, extras: [{ extraId: X1, quantity: 2 }], removedIngredients: ['cebola'] })],
      products(),
    );
    expect(issues).toEqual([]);
    expect(lines[0]).toMatchObject({ lineTotalCents: (3000 + 500 * 2) * 2, removedIngredients: ['Cebola'] });
  });

  it('aponta produto indisponível, adicional não permitido e ingrediente fixo', () => {
    const { lines, issues } = resolveOrderItems(
      [
        item({ productId: P2 }),
        item({ extras: [{ extraId: X2, quantity: 1 }, { extraId: '55555555-5555-4555-8555-555555555555', quantity: 1 }] }),
        item({ removedIngredients: ['Carne'] }),
      ],
      products(),
    );
    expect(lines[0]).toBeNull();
    expect(issues.map((i) => i.reason)).toEqual([
      'PRODUCT_UNAVAILABLE',
      'EXTRA_UNAVAILABLE',
      'EXTRA_NOT_ALLOWED',
      'INGREDIENT_NOT_REMOVABLE',
    ]);
  });
});

describe('buildCartQuote', () => {
  it('cotação válida de retirada: sem taxa e liberada para o checkout', () => {
    const q = buildCartQuote({ items: [item({ quantity: 1, extras: [{ extraId: X1, quantity: 1 }] })], fulfillmentType: 'PICKUP', products: products(), settings, isOpenNow: true });
    expect(q).toMatchObject({ subtotalCents: 3500, deliveryFeeCents: 0, totalCents: 3500, canCheckout: true, issues: [] });
    expect(q.lines[0]).toMatchObject({ name: 'X-Bacon', available: true, imageUrl: '/img/x-bacon.jpg', lineTotalCents: 3500 });
  });

  it('entrega soma a taxa; sem modalidade a taxa é null', () => {
    const base = { items: [item()], products: products(), settings, isOpenNow: true };
    expect(buildCartQuote({ ...base, fulfillmentType: 'DELIVERY' })).toMatchObject({ deliveryFeeCents: 800, totalCents: 3800 });
    expect(buildCartQuote(base)).toMatchObject({ deliveryFeeCents: null, totalCents: 3000 });
  });

  it('item indisponível não entra no total e bloqueia o checkout, com a mensagem na linha', () => {
    const q = buildCartQuote({ items: [item(), item({ productId: P2 })], fulfillmentType: 'PICKUP', products: products(), settings, isOpenNow: true });
    expect(q.subtotalCents).toBe(3000);
    expect(q.canCheckout).toBe(false);
    expect(q.lines[1]).toMatchObject({ name: null, available: false, lineTotalCents: 0 });
    expect(q.lines[1]?.issue).toMatch(/não está mais disponível/);
  });

  it('bloqueia abaixo do pedido mínimo (subtotal, sem taxa)', () => {
    const cheap = new Map(products());
    cheap.set(P1, { ...cheap.get(P1)!, priceCents: 1500 });
    const q = buildCartQuote({ items: [item()], fulfillmentType: 'DELIVERY', products: cheap, settings, isOpenNow: true });
    expect(q.canCheckout).toBe(false);
    expect(q.issues.join(' ')).toMatch(/pedido mínimo/);
  });

  it('loja fechada bloqueia, a menos que aceite pedidos fora do horário', () => {
    const base = { items: [item()], fulfillmentType: 'PICKUP' as const, products: products(), isOpenNow: false };
    expect(buildCartQuote({ ...base, settings }).canCheckout).toBe(false);
    const open = buildCartQuote({ ...base, settings: { ...settings, acceptOrdersOutsideHours: true } });
    expect(open).toMatchObject({ canCheckout: true, outsideBusinessHours: true });
  });

  it('modalidade não aceita bloqueia', () => {
    const q = buildCartQuote({ items: [item()], fulfillmentType: 'DELIVERY', products: products(), settings: { ...settings, acceptsDelivery: false }, isOpenNow: true });
    expect(q.canCheckout).toBe(false);
  });
});

describe('quoteSchema', () => {
  it('aceita itens e modalidade opcional; rejeita preço vindo do cliente e carrinho vazio', () => {
    expect(quoteSchema.safeParse({ items: [{ productId: P1, quantity: 1 }] }).success).toBe(true);
    expect(quoteSchema.safeParse({ fulfillmentType: 'DELIVERY', items: [{ productId: P1, quantity: 2, notes: '' }] }).success).toBe(true);
    expect(quoteSchema.safeParse({ items: [] }).success).toBe(false);
    expect(quoteSchema.safeParse({ items: [{ productId: P1, quantity: 1, price: 1 }] }).success).toBe(false);
    expect(quoteSchema.safeParse({ items: [{ productId: P1, quantity: 1 }], total: 1 }).success).toBe(false);
  });
});
