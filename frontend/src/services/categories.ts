import type { Category, CategoryInput } from "@/types";
import { request } from "./http";
import { toCategory, type ApiCategory } from "./mappers";

export const categoriesService = {
  /** Só as categorias ativas, já ordenadas pelo backend. */
  list: async (signal?: AbortSignal): Promise<Category[]> => (await request<ApiCategory[]>("/categories", { signal })).map(toCategory),

  // Administração integrada ao backend protegido.
  adminList: async (signal?: AbortSignal): Promise<Category[]> => (await request<Array<ApiCategory & { active?: boolean; sortOrder?: number }>>("/admin/categories", { admin: true, signal })).map((c, i) => ({ id:c.id, name:c.name, slug:c.slug, order:c.sortOrder ?? i, active:c.active ?? true, productCount:c.productCount })),
  create: async (input: CategoryInput) => { const c = await request<ApiCategory & { active?: boolean; sortOrder?: number }>("/admin/categories", { method: "POST", body: input, admin: true }); return { id:c.id,name:c.name,slug:c.slug,order:c.sortOrder??0,active:c.active??true,productCount:c.productCount }; },
  update: async (id: string, input: CategoryInput) => { const c = await request<ApiCategory & { active?: boolean; sortOrder?: number }>(`/admin/categories/${encodeURIComponent(id)}`, { method: "PATCH", body: input, admin: true }); return { id:c.id,name:c.name,slug:c.slug,order:c.sortOrder??0,active:c.active??true,productCount:c.productCount }; },
  reorder: (ids: string[]) => request<void>("/admin/categories/order", { method: "PATCH", body: { ids }, admin: true }),
  remove: (id: string) => request<void>(`/admin/categories/${encodeURIComponent(id)}`, { method: "DELETE", admin: true }),
};
