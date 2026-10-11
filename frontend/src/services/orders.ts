import type {
  AdminOrderDetail,
  AdminOrderSummary,
  CartQuote,
  CreateOrderPayload,
  Fulfillment,
  OrderItemInput,
  OrderStatus,
  Paginated,
  PublicOrder,
} from "@/types";
import { request } from "./http";

export interface OrderFilters {
  q?: string;
  status?: OrderStatus | "";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export const ordersService = {
  /** O backend confere disponibilidade e calcula os preços oficiais. */
  quote: (items: OrderItemInput[], fulfillment: Fulfillment | undefined, signal?: AbortSignal) =>
    request<CartQuote>("/cart/quote", { method: "POST", body: { items, fulfillment }, signal }),

  /** `idempotencyKey` evita pedidos duplicados em cliques repetidos ou reenvios. */
  create: (payload: CreateOrderPayload, idempotencyKey: string) =>
    request<PublicOrder>("/orders", { method: "POST", body: payload, headers: { "Idempotency-Key": idempotencyKey } }),

  // Administração
  adminList: (filters: OrderFilters, signal?: AbortSignal) =>
    request<Paginated<AdminOrderSummary>>("/admin/orders", { admin: true, query: { ...filters }, signal }),
  adminGet: (id: string, signal?: AbortSignal) =>
    request<AdminOrderDetail>(`/admin/orders/${encodeURIComponent(id)}`, { admin: true, signal }),
  changeStatus: (id: string, status: OrderStatus, reason?: string) =>
    request<AdminOrderDetail>(`/admin/orders/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: { status, reason },
      admin: true,
    }),
  saveInternalNotes: (id: string, internalNotes: string) =>
    request<AdminOrderDetail>(`/admin/orders/${encodeURIComponent(id)}/notes`, {
      method: "PATCH",
      body: { internalNotes },
      admin: true,
    }),
};
