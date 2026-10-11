import type { AdminSettings, PublicSettings } from "@/types";
import { request } from "./http";

export const settingsService = {
  getPublic: (signal?: AbortSignal) => request<PublicSettings>("/settings", { signal }),

  adminGet: (signal?: AbortSignal) => request<AdminSettings>("/admin/settings", { admin: true, signal }),
  adminSave: (input: AdminSettings) => request<AdminSettings>("/admin/settings", { method: "PUT", body: input, admin: true }),
};
