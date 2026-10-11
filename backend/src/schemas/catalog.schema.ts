import { z } from 'zod';

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

// "?search=" vazio é tratado como ausente.
const emptyToUndefined = (v: unknown) => (v === '' ? undefined : v);

export const productListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  category: z.preprocess(emptyToUndefined, slug.optional()),
  search: z.preprocess(emptyToUndefined, z.string().trim().min(2).max(80).optional()),
  featured: z.preprocess(emptyToUndefined, z.enum(['true', 'false']).transform((v) => v === 'true').optional()),
  sort: z.enum(['default', 'price_asc', 'price_desc', 'name']).default('default'),
});
export type ProductListQuery = z.infer<typeof productListQuerySchema>;

export const extraListQuerySchema = z.object({
  product: z.preprocess(emptyToUndefined, slug.optional()),
});
export type ExtraListQuery = z.infer<typeof extraListQuerySchema>;

export const slugParamSchema = slug;
