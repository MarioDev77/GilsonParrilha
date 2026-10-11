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
import { ORDER_STATUS_TO_API, toOrderStatus, toFulfillment, toApiCreateOrder, toApiQuoteBody, toCartQuote, toPublicOrder, type ApiCartQuote, type ApiCreatedOrder } from "./mappers";

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
  quote: async (items: OrderItemInput[], fulfillment: Fulfillment | undefined, signal?: AbortSignal): Promise<CartQuote> =>
    toCartQuote(await request<ApiCartQuote>("/cart/quote", { method: "POST", body: toApiQuoteBody(items, fulfillment), signal }), items),

  /** `idempotencyKey` evita pedidos duplicados em cliques repetidos ou reenvios. */
  create: async (payload: CreateOrderPayload, idempotencyKey: string): Promise<PublicOrder> =>
    toPublicOrder(
      await request<ApiCreatedOrder>("/orders", { method: "POST", body: toApiCreateOrder(payload), headers: { "Idempotency-Key": idempotencyKey } }),
      payload
    ),

  // Administração
  adminList: async (filters: OrderFilters, signal?: AbortSignal): Promise<Paginated<AdminOrderSummary>> => {
    const query = { ...filters, status: filters.status ? ORDER_STATUS_TO_API[filters.status] : undefined };
    const result = await request<Paginated<any>>("/admin/orders", { admin: true, query, signal });
    return { ...result, items: result.items.map((o) => ({ ...o, status: toOrderStatus(o.status), fulfillment: toFulfillment(o.fulfillment), total: Number(o.total) })) };
  },
  adminGet: async (id: string, signal?: AbortSignal): Promise<AdminOrderDetail> => mapAdminOrder(await request<any>(`/admin/orders/${encodeURIComponent(id)}`, { admin: true, signal })),
  changeStatus: (id: string, status: OrderStatus, reason?: string) =>
    request<AdminOrderDetail>(`/admin/orders/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: { status: ORDER_STATUS_TO_API[status], reason },
      admin: true,
    }).then(mapAdminOrder),
  saveInternalNotes: (id: string, internalNotes: string) =>
    request<AdminOrderDetail>(`/admin/orders/${encodeURIComponent(id)}/notes`, {
      method: "PATCH",
      body: { internalNotes },
      admin: true,
    }).then(mapAdminOrder),
};

function mapAdminOrder(o: any): AdminOrderDetail {
  return { ...o, status: toOrderStatus(o.status), fulfillment: toFulfillment(o.fulfillment), total:Number(o.total), subtotal:Number(o.subtotal), deliveryFee:Number(o.deliveryFee), items:(o.items ?? []).map((i:any) => ({ name:i.name ?? i.productName, quantity:i.quantity, unitPrice:Number(i.unitPrice ?? i.price ?? 0), subtotal:Number(i.lineTotal ?? i.subtotal ?? 0), addons:(i.extras ?? i.addons ?? []).map((e:any)=>({name:e.name,price:Number(e.price ?? 0)})), removedIngredients:i.removedIngredients ?? [], notes:i.notes ?? null })), allowedTransitions:(o.allowedTransitions ?? []).map((s:string)=>toOrderStatus(s)) };
}
