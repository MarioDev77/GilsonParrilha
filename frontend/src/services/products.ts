import type { Paginated, Product, ProductInput } from "@/types";
import { request, requestPage } from "./http";
import { toProduct, type ApiProduct } from "./mappers";

/** O backend limita cada página a 50 itens. */
const PAGE_SIZE = 50;
/** Trava de segurança contra laço infinito se o backend devolver um `totalPages` absurdo. */
const MAX_PAGES = 40;

export const productsService = {
  /**
   * Cardápio público completo: o backend pagina (máx. 50 por página), então buscamos todas as páginas.
   * `category` é o SLUG da categoria. Só vêm produtos disponíveis.
   */
  list: async (params: { category?: string; featured?: boolean; search?: string } = {}, signal?: AbortSignal): Promise<Product[]> => {
    const all: Product[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const res = await requestPage<ApiProduct>("/products", { query: { ...params, page, pageSize: PAGE_SIZE }, signal });
      all.push(...res.data.map(toProduct));
      if (page >= res.meta.totalPages) break;
    }
    return all;
  },

  /** Aceita o slug ou o id do produto. O detalhe inclui os adicionais. */
  get: async (slugOrId: string, signal?: AbortSignal): Promise<Product> =>
    toProduct(await request<ApiProduct>(`/products/${encodeURIComponent(slugOrId)}`, { signal })),

  // Administração integrada ao backend protegido.
  adminList: async (params: { q?: string; page?: number; pageSize?: number } = {}, signal?: AbortSignal): Promise<Paginated<Product>> => {
    const page = await request<Paginated<ApiProduct>>("/admin/products", { admin: true, query: params, signal });
    return { ...page, items: page.items.map(toProduct) };
  },
  create: async (input: ProductInput) => toProduct(await request<ApiProduct>("/admin/products", { method: "POST", body: input, admin: true })),
  update: async (id: string, input: ProductInput) =>
    toProduct(await request<ApiProduct>(`/admin/products/${encodeURIComponent(id)}`, { method: "PATCH", body: input, admin: true })),
  setAvailability: async (id: string, available: boolean) => toProduct(await request<ApiProduct>(`/admin/products/${encodeURIComponent(id)}/availability`, { method: "PATCH", body: { available }, admin: true })),
  /** O backend decide entre excluir de vez ou arquivar (ex.: produto já usado em pedidos). */
  remove: (id: string) => request<void>(`/admin/products/${encodeURIComponent(id)}`, { method: "DELETE", admin: true }),
};
