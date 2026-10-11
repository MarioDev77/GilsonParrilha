import type { AdminSettings, PublicSettings } from "@/types";
import { request } from "./http";
import { toPublicSettings, type ApiPublicSettings } from "./mappers";

function normalizeAdminSettings(v: Record<string, unknown>): AdminSettings {
  const opening = v.openingHours;
  const rows = Array.isArray(opening) ? opening as { day: string; hours: string }[] : [];
  return {
    businessName: String(v.businessName ?? ""), logoUrl: typeof v.logoUrl === "string" ? v.logoUrl : null,
    heroImageUrl: typeof v.heroImageUrl === "string" ? v.heroImageUrl : null, heroHeadline: typeof v.heroHeadline === "string" ? v.heroHeadline : null,
    whatsapp: String(v.whatsapp ?? ""), phone: typeof v.phone === "string" ? v.phone : null, address: typeof v.address === "string" ? v.address : null,
    instagramUrl: typeof v.instagramUrl === "string" ? v.instagramUrl : null, facebookUrl: typeof v.facebookUrl === "string" ? v.facebookUrl : null,
    openingHours: rows, acceptsDelivery: Boolean(v.acceptsDelivery), acceptsPickup: Boolean(v.acceptsPickup),
    deliveryFee: v.deliveryFee == null ? null : Number(v.deliveryFee), minimumOrder: v.minimumOrder == null ? null : Number(v.minimumOrder),
    prepTimeMinutes: v.prepTimeMinutes == null ? null : Number(v.prepTimeMinutes), serviceMessage: typeof v.serviceMessage === "string" ? v.serviceMessage : null,
  };
}

export const settingsService = {
  getPublic: async (signal?: AbortSignal): Promise<PublicSettings> =>
    toPublicSettings(await request<ApiPublicSettings>("/settings/public", { signal })),

  // O backend persiste horários por dia da semana; o formulário trabalha com linhas legíveis.
  adminGet: async (signal?: AbortSignal): Promise<AdminSettings> => normalizeAdminSettings(await request<Record<string, unknown>>("/admin/settings", { admin: true, signal })),
  adminSave: async (input: AdminSettings): Promise<AdminSettings> => normalizeAdminSettings(await request<Record<string, unknown>>("/admin/settings", { method: "PATCH", body: { ...input, openingHours: input.openingHours }, admin: true })),
};
