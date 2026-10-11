import { AppError } from '../errors/app-error';
import { catalogRepository } from '../repositories/catalog.repository';
import type { ExtraListQuery, ProductListQuery } from '../schemas/catalog.schema';
import { buildPageMeta } from '../utils/pagination';
import {
  toPublicCategory,
  toPublicExtra,
  toPublicProduct,
  type CategoryRow,
  type ExtraRow,
  type ProductRow,
} from './catalog.mapper';

export const catalogService = {
  async listCategories() {
    const rows: CategoryRow[] = await catalogRepository.listCategories();
    return rows.map(toPublicCategory);
  },

  async listProducts(query: ProductListQuery) {
    const { total, items } = await catalogRepository.listProducts(query);
    return {
      data: (items as ProductRow[]).map(toPublicProduct),
      meta: buildPageMeta(query.page, query.pageSize, total),
    };
  },

  async getProduct(slug: string) {
    const row = (await catalogRepository.findProductBySlug(slug)) as
      | (ProductRow & { extras: { extra: ExtraRow }[] })
      | null;
    if (!row) throw AppError.notFound('Produto não encontrado');
    return { ...toPublicProduct(row), extras: row.extras.map((pe) => toPublicExtra(pe.extra)) };
  },

  async listExtras(query: ExtraListQuery) {
    const rows: ExtraRow[] = await catalogRepository.listExtras(query.product);
    return rows.map(toPublicExtra);
  },
};
