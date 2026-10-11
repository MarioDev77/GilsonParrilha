import { describe, expect, it } from 'vitest';
import { buildCompactOrderMessage, buildOrderMessage, buildWhatsappLink, buildWhatsappUrl, type WhatsappOrder } from '../../src/utils/whatsapp';

const base: WhatsappOrder = {
  orderNumber: 42,
  customerName: 'Maria Silva',
  customerPhone: '5575999998888',
  fulfillmentType: 'DELIVERY',
  deliveryAddress: 'Rua das Flores, 100, Centro',
  deliveryReference: 'Perto da praça',
  customerNotes: 'Tocar a campainha',
  subtotalCents: 8380,
  deliveryFeeCents: 600,
  totalCents: 8980,
  outsideBusinessHours: false,
  items: [
    {
      productName: 'X-Bacon',
      quantity: 2,
      lineTotalCents: 8380,
      removedIngredients: ['cebola'],
      notes: 'Bem passado',
      extras: [
        { name: 'Bacon extra', unitPriceCents: 400, quantity: 1 },
        { name: 'Cheddar', unitPriceCents: 250, quantity: 2 },
      ],
    },
  ],
};

describe('buildOrderMessage', () => {
  it('contém todos os dados exigidos (entrega)', () => {
    const msg = buildOrderMessage('Gilson Parrilha', base);
    for (const part of [
      'Gilson Parrilha',
      'Pedido #42',
      'Maria Silva',
      '(75) 99999-8888',
      'Entrega',
      'Rua das Flores, 100, Centro',
      'Referência: Perto da praça',
      '2x X-Bacon — R$ 83,80',
      '+ Bacon extra (R$ 4,00)',
      '+ 2x Cheddar (R$ 5,00)',
      'Sem: cebola',
      'Obs.: Bem passado',
      'Observações: Tocar a campainha',
      'Subtotal: R$ 83,80',
      'Taxa de entrega: R$ 6,00',
      'Total: R$ 89,80',
    ]) {
      expect(msg).toContain(part);
    }
  });

  it('retirada: sem endereço nem taxa de entrega', () => {
    const msg = buildOrderMessage('Gilson Parrilha', {
      ...base,
      fulfillmentType: 'PICKUP',
      deliveryAddress: null,
      deliveryReference: null,
      deliveryFeeCents: 0,
      totalCents: 8380,
    });
    expect(msg).toContain('Retirada');
    expect(msg).not.toContain('Endereço');
    expect(msg).not.toContain('Taxa de entrega');
  });

  it('sinaliza pedido fora do horário e nunca afirma confirmação ou envio', () => {
    const msg = buildOrderMessage('Gilson Parrilha', { ...base, outsideBusinessHours: true });
    expect(msg).toContain('depende de confirmação da equipe');
    expect(msg.toLowerCase()).not.toContain('pedido confirmado');
  });
});

describe('buildWhatsappUrl', () => {
  it('usa o formato wa.me com texto codificado', () => {
    const url = buildWhatsappUrl('5575999998888', 'Olá & pedido #1\nTotal: R$ 10,00');
    expect(url).toMatch(/^https:\/\/wa\.me\/5575999998888\?text=/);
    expect(url).toContain('%26'); // &
    expect(url).toContain('%0A'); // quebra de linha
    expect(url).toContain('%23'); // #
    expect(url).not.toContain(' ');
    const text = new URL(url).searchParams.get('text');
    expect(text).toBe('Olá & pedido #1\nTotal: R$ 10,00');
  });

  it('rejeita número inválido (evita link para destino errado)', () => {
    expect(() => buildWhatsappUrl('abc', 'x')).toThrow();
    expect(() => buildWhatsappUrl('+5575999998888', 'x')).toThrow();
    expect(() => buildWhatsappUrl('5575999998888/../x', 'x')).toThrow();
    expect(() => buildWhatsappUrl('123', 'x')).toThrow();
  });
});

describe('buildWhatsappLink', () => {
  it('pedido pequeno usa a mensagem completa', () => {
    const { url, message } = buildWhatsappLink('Gilson Parrilha', '5575999998888', base);
    expect(message).toContain('*Itens*');
    expect(url).toContain('wa.me/5575999998888');
  });

  it('pedido enorme cai para a versão compacta (URL não estoura)', () => {
    const items = Array.from({ length: 30 }, (_, i) => ({
      ...base.items[0]!,
      productName: `Hambúrguer artesanal especial número ${i}`,
      notes: 'Observação longa '.repeat(10),
    }));
    const { url, message } = buildWhatsappLink('Gilson Parrilha', '5575999998888', { ...base, items });
    expect(message).toContain('detalhes no sistema');
    expect(message).toContain('Pedido #42');
    expect(message).toContain('Total: R$ 89,80');
    expect(url.length).toBeLessThan(3200);
  });

  it('versão compacta mantém número, cliente e totais', () => {
    const msg = buildCompactOrderMessage('Gilson Parrilha', base);
    expect(msg).toContain('Pedido #42');
    expect(msg).toContain('Maria Silva');
    expect(msg).toContain('Itens: 2');
  });
});
