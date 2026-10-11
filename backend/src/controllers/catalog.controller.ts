import type { RequestHandler } from 'express';
import { AppError } from '../errors/app-error';
import { slugParamSchema } from '../schemas/catalog.schema';
import type { ExtraListQuery, ProductListQuery } from '../schemas/catalog.schema';
import { catalogService } from '../services/catalog.service';
import { asyncHandler } from '../utils/async-handler';

export const listCategories: RequestHandler = asyncHandler(async (_req, res) => {
  res.json({ data: await catalogService.listCategories() });
});

export const listProducts: RequestHandler = asyncHandler(async (_req, res) => {
  res.json(await catalogService.listProducts(res.locals.query as ProductListQuery));
});

export const getProduct: RequestHandler = asyncHandler(async (req, res) => {
  const slug = slugParamSchema.safeParse(req.params.slug);
  if (!slug.success) throw AppError.notFound('Produto não encontrado');
  res.json({ data: await catalogService.getProduct(slug.data) });
});

export const listExtras: RequestHandler = asyncHandler(async (_req, res) => {
  res.json({ data: await catalogService.listExtras(res.locals.query as ExtraListQuery) });
});
