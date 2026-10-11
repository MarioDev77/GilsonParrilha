import { prisma } from '../config/prisma';
import type { Prisma } from '@prisma/client';

// Mesmo formato de leitura para pedido recém-criado, repetição idempotente e consulta pública.
const orderInclude = {
  items: {
    orderBy: { position: 'asc' },
    include: { extras: { orderBy: { position: 'asc' } } },
  },
} satisfies Prisma.OrderInclude;

export type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

// Visibilidade para quem monta um pedido: produto ativo, não arquivado, categoria ativa.
const orderableProduct = { isActive: true, archivedAt: null, category: { isActive: true } } as const;

export const orderRepository = {
  // Produtos pedidos + TODOS os vínculos de adicionais (a regra decide o que é permitido/indisponível).
  findProductsForOrder(ids: string[]) {
    return prisma.product.findMany({
      where: { id: { in: ids }, ...orderableProduct },
      select: {
        id: true,
        name: true,
        priceCents: true,
        isAvailable: true,
        removableIngredients: true,
        extras: {
          select: {
            extra: {
              select: { id: true, name: true, priceCents: true, isActive: true, isAvailable: true, archivedAt: true },
            },
          },
        },
      },
    });
  },

  // Criação atômica: pedido + itens + adicionais + histórico inicial na MESMA transação.
  create(data: Prisma.OrderCreateInput): Promise<OrderWithItems> {
    return prisma.order.create({ data, include: orderInclude });
  },

  findByIdempotencyKey(key: string): Promise<OrderWithItems | null> {
    return prisma.order.findUnique({ where: { idempotencyKey: key }, include: orderInclude });
  },

  findByPublicId(publicId: string): Promise<OrderWithItems | null> {
    return prisma.order.findUnique({ where: { publicId }, include: orderInclude });
  },
};
