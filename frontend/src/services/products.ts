import type { Paginated, Product, ProductInput } from "@/types";
import { request } from "./http";

export const productsService = {
  list: (params: { categoryId?: string; featured?: boolean } = {}, signal?: AbortSignal) =>
    request<Product[]>("/products", { query: params, signal }),
  get: (id: string, signal?: AbortSignal) => request<Product>(`/products/${encodeURIComponent(id)}`, { signal }),

  // Administração
  adminList: (params: { q?: string; page?: number; pageSize?: number } = {}, signal?: AbortSignal) =>
    request<Paginated<Product>>("/admin/products", { admin: true, query: params, signal }),
  create: (input: ProductInput) => request<Product>("/admin/products", { method: "POST", body: input, admin: true }),
  update: (id: string, input: ProductInput) =>
    request<Product>(`/admin/products/${encodeURIComponent(id)}`, { method: "PUT", body: input, admin: true }),
  setAvailability: (id: string, available: boolean) =>
    request<Product>(`/admin/products/${encodeURIComponent(id)}/availability`, { method: "PATCH", body: { available }, admin: true }),
  /** O backend decide entre excluir de vez ou arquivar (ex.: produto já usado em pedidos). */
  remove: (id: string) => request<void>(`/admin/products/${encodeURIComponent(id)}`, { method: "DELETE", admin: true }),
};
