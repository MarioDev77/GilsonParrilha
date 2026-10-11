import { prisma } from '../config/prisma';
import type { ProductListQuery } from '../schemas/catalog.schema';

// Regras de visibilidade do cardápio público — num único lugar.
const visibleProduct = {
  isActive: true,
  archivedAt: null,
  category: { isActive: true },
};
const visibleExtra = { isActive: true, isAvailable: true, archivedAt: null };

const extraSelect = { id: true, name: true, description: true, priceCents: true } as const;

const productSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  ingredients: true,
  removableIngredients: true,
  priceCents: true,
  imageUrl: true,
  isFeatured: true,
  isAvailable: true,
  category: { select: { id: true, name: true, slug: true } },
} as const;

function productOrderBy(sort: ProductListQuery['sort']) {
  switch (sort) {
    case 'price_asc':
      return [{ priceCents: 'asc' as const }, { name: 'asc' as const }];
    case 'price_desc':
      return [{ priceCents: 'desc' as const }, { name: 'asc' as const }];
    case 'name':
      return [{ name: 'asc' as const }];
    default:
      return [{ sortOrder: 'asc' as const }, { name: 'asc' as const }];
  }
}

export const catalogRepository = {
  listCategories() {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        _count: { select: { products: { where: { ...visibleProduct, isAvailable: true } } } },
      },
    });
  },

  async listProducts(query: ProductListQuery) {
    const where = {
      ...visibleProduct,
      isAvailable: true,
      ...(query.category ? { category: { isActive: true, slug: query.category } } : {}),
      ...(query.featured !== undefined ? { isFeatured: query.featured } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' as const } },
              { description: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [total, items] = await prisma.$transaction([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: productOrderBy(query.sort),
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: productSelect,
      }),
    ]);
    return { total, items };
  },

  findProductBySlug(slug: string) {
    return prisma.product.findFirst({
      where: { slug, ...visibleProduct },
      select: {
        ...productSelect,
        extras: {
          where: { extra: visibleExtra },
          orderBy: { extra: { sortOrder: 'asc' } },
          select: { extra: { select: extraSelect } },
        },
      },
    });
  },

  listExtras(productSlug?: string) {
    return prisma.extra.findMany({
      where: {
        ...visibleExtra,
        ...(productSlug
          ? { products: { some: { product: { slug: productSlug, isActive: true, archivedAt: null } } } }
          : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: extraSelect,
    });
  },
};
