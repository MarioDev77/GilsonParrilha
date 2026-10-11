import type { AdminRole, AdminUser } from "@/types";
import { request } from "./http";

export interface UserInput {
  name: string;
  email: string;
  role: string;
  active: boolean;
  password?: string;
}

export const usersService = {
  list: (signal?: AbortSignal) => request<AdminUser[]>("/admin/users", { admin: true, signal }),
  roles: (signal?: AbortSignal) => request<AdminRole[]>("/admin/roles", { admin: true, signal }),
  create: (input: UserInput) => request<AdminUser>("/admin/users", { method: "POST", body: input, admin: true }),
  update: (id: string, input: Omit<UserInput, "password">) =>
    request<AdminUser>(`/admin/users/${encodeURIComponent(id)}`, { method: "PATCH", body: input, admin: true }),
  remove: (id: string) => request<void>(`/admin/users/${encodeURIComponent(id)}`, { method: "DELETE", admin: true }),
};
