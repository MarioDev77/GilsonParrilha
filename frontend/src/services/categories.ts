import type { Category, CategoryInput } from "@/types";
import { request } from "./http";

export const categoriesService = {
  list: (signal?: AbortSignal) => request<Category[]>("/categories", { signal }),

  adminList: (signal?: AbortSignal) => request<Category[]>("/admin/categories", { admin: true, signal }),
  create: (input: CategoryInput) => request<Category>("/admin/categories", { method: "POST", body: input, admin: true }),
  update: (id: string, input: CategoryInput) =>
    request<Category>(`/admin/categories/${encodeURIComponent(id)}`, { method: "PUT", body: input, admin: true }),
  reorder: (ids: string[]) => request<void>("/admin/categories/order", { method: "PUT", body: { ids }, admin: true }),
  remove: (id: string) => request<void>(`/admin/categories/${encodeURIComponent(id)}`, { method: "DELETE", admin: true }),
};
