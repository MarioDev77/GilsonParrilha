import { describe, expect, it } from 'vitest';
import { extraListQuerySchema, productListQuerySchema, slugParamSchema } from '../../src/schemas/catalog.schema';
import { toPublicProduct } from '../../src/services/catalog.mapper';
import { buildPageMeta } from '../../src/utils/pagination';

describe('productListQuerySchema', () => {
  it('aplica padrões e converte tipos', () => {
    const q = productListQuerySchema.parse({});
    expect(q).toMatchObject({ page: 1, pageSize: 20, sort: 'default' });
    const q2 = productListQuerySchema.parse({ page: '2', pageSize: '10', featured: 'true', search: ' bacon ' });
    expect(q2).toMatchObject({ page: 2, pageSize: 10, featured: true, search: 'bacon' });
  });

  it('trata parâmetros vazios como ausentes', () => {
    const q = productListQuerySchema.parse({ search: '', category: '', featured: '' });
    expect(q.search).toBeUndefined();
    expect(q.category).toBeUndefined();
    expect(q.featured).toBeUndefined();
  });

  it('rejeita valores inválidos', () => {
    expect(productListQuerySchema.safeParse({ page: '0' }).success).toBe(false);
    expect(productListQuerySchema.safeParse({ pageSize: '500' }).success).toBe(false);
    expect(productListQuerySchema.safeParse({ sort: 'DROP TABLE' }).success).toBe(false);
    expect(productListQuerySchema.safeParse({ category: "x'; --" }).success).toBe(false);
    expect(productListQuerySchema.safeParse({ search: 'a' }).success).toBe(false);
    expect(productListQuerySchema.safeParse({ page: ['1', '2'] }).success).toBe(false);
  });

  it('descarta parâmetros desconhecidos', () => {
    const q = productListQuerySchema.parse({ isActive: 'false', archived: 'true' });
    expect(q).not.toHaveProperty('isActive');
    expect(q).not.toHaveProperty('archived');
  });
});

describe('slug e extras', () => {
  it('valida slug', () => {
    expect(slugParamSchema.safeParse('x-burger-bacon').success).toBe(true);
    expect(slugParamSchema.safeParse('../etc/passwd').success).toBe(false);
    expect(slugParamSchema.safeParse('Com Espaço').success).toBe(false);
  });
  it('filtro de extras por produto', () => {
    expect(extraListQuerySchema.parse({ product: 'x-bacon' }).product).toBe('x-bacon');
  });
});

describe('toPublicProduct', () => {
  it('expõe apenas campos públicos', () => {
    const row = {
      id: 'p1',
      name: 'X-Bacon',
      slug: 'x-bacon',
      description: 'Suculento',
      ingredients: ['pão', 'carne'],
      removableIngredients: ['carne'],
      priceCents: 3290,
      imageUrl: null,
      isFeatured: true,
      isAvailable: true,
      category: { id: 'c1', name: 'Hambúrgueres', slug: 'hamburgueres' },
      // campos que NÃO podem vazar:
      isActive: true,
      archivedAt: null,
      createdAt: new Date(),
    };
    const dto = toPublicProduct(row);
    expect(dto).not.toHaveProperty('isActive');
    expect(dto).not.toHaveProperty('archivedAt');
    expect(dto).not.toHaveProperty('createdAt');
    expect(dto.priceCents).toBe(3290);
    expect(dto.hasExtras).toBe(false);
  });

  it('indica se o produto aceita adicionais sem expor os vínculos', () => {
    const row = {
      id: 'p1', name: 'X', slug: 'x', description: '', ingredients: [], removableIngredients: [], priceCents: 1000,
      imageUrl: null, isFeatured: false, isAvailable: true, category: { id: 'c1', name: 'C', slug: 'c' },
      extras: [{ extraId: 'e1' }],
    };
    const dto = toPublicProduct(row);
    expect(dto.hasExtras).toBe(true);
    expect(dto).not.toHaveProperty('extras');
  });
});

describe('buildPageMeta', () => {
  it('calcula totalPages', () => {
    expect(buildPageMeta(1, 20, 41)).toEqual({ page: 1, pageSize: 20, total: 41, totalPages: 3 });
    expect(buildPageMeta(1, 20, 0).totalPages).toBe(0);
  });
});
