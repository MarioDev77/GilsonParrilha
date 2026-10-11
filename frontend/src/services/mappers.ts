/**
 * Única camada que conhece o formato da API do backend (valores em centavos, enums em pt-BR,
 * nomes de campo próprios). Tudo que sai daqui já está no formato dos modelos de `@/types`
 * (valores em reais), então as telas não precisam saber nada do backend.
 */
import { API_URL } from "@/config/site";
import type {
  AdminUser,
  Category,
  CartQuote,
  CreateOrderPayload,
  Fulfillment,
  OpeningHour,
  OrderItemInput,
  OrderLineView,
  OrderStatus,
  Product,
  PublicOrder,
  PublicSettings,
  QuotedLine,
} from "@/types";

/* ------------------------------------------------------------------ */
/* Formato do backend                                                  */
/* ------------------------------------------------------------------ */

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  productCount: number;
}

export interface ApiExtra {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
}

export interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  ingredients: string[];
  removableIngredients: string[];
  priceCents: number;
  imageUrl: string | null;
  isFeatured: boolean;
  isAvailable: boolean;
  hasExtras: boolean;
  category: { id: string; name: string; slug: string };
  /** Só no detalhe do produto. */
  extras?: ApiExtra[];
}

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type ApiOpeningHours = Partial<Record<DayKey, { open: string; close: string }[]>>;

export interface ApiPublicSettings {
  tradeName: string;
  whatsappNumber: string;
  address: string | null;
  openingHours: ApiOpeningHours;
  timezone: string;
  isOpenNow: boolean;
  acceptOrdersOutsideHours: boolean;
  acceptsDelivery: boolean;
  acceptsPickup: boolean;
  deliveryFeeCents: number;
  minOrderCents: number;
  estimatedPrepMinutes: number;
  defaultMessage?: string | null;
  socialLinks: unknown;
  menuSettings: unknown;
}

export interface ApiAdmin {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface ApiQuoteLine {
  index: number;
  productId: string;
  name: string | null;
  imageUrl: string | null;
  available: boolean;
  quantity: number;
  unitPriceCents: number;
  extras: { extraId: string; name: string; unitPriceCents: number; quantity: number }[];
  removedIngredients: string[];
  notes: string | null;
  lineTotalCents: number;
  issue: string | null;
}

export interface ApiCartQuote {
  lines: ApiQuoteLine[];
  subtotalCents: number;
  deliveryFeeCents: number | null;
  totalCents: number;
  minOrderCents: number;
  canCheckout: boolean;
  issues: string[];
}

export interface ApiOrderItem {
  productName: string;
  quantity: number;
  unitPriceCents: number;
  removedIngredients: string[];
  notes: string | null;
  extras: { name: string; quantity: number; unitPriceCents: number }[];
  lineTotalCents: number;
}

export interface ApiCreatedOrder {
  order: {
    publicId: string;
    orderNumber: number;
    status: string;
    customerName: string;
    fulfillmentType: string;
    deliveryAddress: string | null;
    deliveryReference: string | null;
    customerNotes: string | null;
    items: ApiOrderItem[];
    subtotalCents: number;
    deliveryFeeCents: number;
    totalCents: number;
  };
  whatsapp: { url: string; message: string };
  notice: string;
}

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

/** Centavos inteiros → reais. */
export const fromCents = (cents: number): number => cents / 100;

const API_ORIGIN = (() => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return "";
  }
})();

/** Imagens: URL absoluta passa direto; caminho relativo (ex.: /uploads/x.jpg) aponta para o servidor da API. */
export function assetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url) || url.startsWith("data:")) return url;
  return url.startsWith("/") ? `${API_ORIGIN}${url}` : url;
}

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export const FULFILLMENT_TO_API: Record<Fulfillment, "DELIVERY" | "PICKUP"> = { delivery: "DELIVERY", pickup: "PICKUP" };
const FULFILLMENT_FROM_API: Record<string, Fulfillment> = { DELIVERY: "delivery", PICKUP: "pickup" };

export const ORDER_STATUS_TO_API: Record<OrderStatus, string> = {
  awaiting_whatsapp: "AGUARDANDO_CONTATO_WHATSAPP",
  confirmed: "CONFIRMADO",
  preparing: "EM_PREPARACAO",
  ready: "PRONTO",
  out_for_delivery: "SAIU_PARA_ENTREGA",
  completed: "CONCLUIDO",
  cancelled: "CANCELADO",
};
const ORDER_STATUS_FROM_API = Object.fromEntries(Object.entries(ORDER_STATUS_TO_API).map(([k, v]) => [v, k])) as Record<string, OrderStatus>;

export const toOrderStatus = (status: string): OrderStatus => ORDER_STATUS_FROM_API[status] ?? "awaiting_whatsapp";
export const toFulfillment = (type: string): Fulfillment => FULFILLMENT_FROM_API[type] ?? "pickup";

/* ------------------------------------------------------------------ */
/* Cardápio                                                            */
/* ------------------------------------------------------------------ */

/** O backend já entrega as categorias ordenadas e só as ativas. */
export function toCategory(c: ApiCategory, index: number): Category {
  return { id: c.id, name: c.name, slug: c.slug, order: index, active: true, productCount: c.productCount };
}

export function toProduct(p: ApiProduct): Product {
  const addons = (p.extras ?? []).map((e) => ({ id: e.id, name: e.name, price: fromCents(e.priceCents), available: (e as ApiExtra & { isAvailable?: boolean }).isAvailable !== false }));
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    ingredients: p.ingredients,
    removableIngredients: p.removableIngredients,
    price: fromCents(p.priceCents),
    imageUrl: assetUrl(p.imageUrl),
    categoryId: p.category.id,
    categoryName: p.category.name,
    available: p.isAvailable,
    featured: p.isFeatured,
    badge: null,
    addons,
    hasAddons: p.extras ? addons.length > 0 : p.hasExtras,
  };
}

/* ------------------------------------------------------------------ */
/* Configurações da loja                                               */
/* ------------------------------------------------------------------ */

const DAYS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "Segunda" },
  { key: "tue", label: "Terça" },
  { key: "wed", label: "Quarta" },
  { key: "thu", label: "Quinta" },
  { key: "fri", label: "Sexta" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
];

const clock = (hhmm: string): string => {
  const [h, m] = hhmm.split(":");
  const hour = Number(h);
  return m && m !== "00" ? `${hour}h${m}` : `${hour}h`;
};

/**
 * { mon: [{open:"18:00", close:"23:30"}], ... } → [{ day: "Terça a Domingo", hours: "18h às 23h30" }].
 * Dias seguidos com o mesmo horário viram uma linha. O texto segue o formato que `utils/openStatus.ts` entende.
 */
export function toOpeningHours(hours: ApiOpeningHours | null | undefined): OpeningHour[] {
  const rows = DAYS.map(({ key, label }) => {
    const intervals = hours?.[key] ?? [];
    return { label, text: intervals.length ? intervals.map((i) => `${clock(i.open)} às ${clock(i.close)}`).join(" e ") : "Fechado" };
  });

  const grouped: OpeningHour[] = [];
  let start = 0;
  for (let i = 1; i <= rows.length; i++) {
    if (i < rows.length && rows[i].text === rows[start].text) continue;
    const first = rows[start].label;
    const last = rows[i - 1].label;
    grouped.push({ day: start === i - 1 ? first : `${first} a ${last}`, hours: rows[start].text });
    start = i;
  }
  return grouped;
}

function socialUrl(value: unknown, base: string): string | null {
  const v = str(value);
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  return `${base}${v.replace(/^@/, "")}`;
}

export function toPublicSettings(s: ApiPublicSettings): PublicSettings {
  const social = obj(s.socialLinks);
  const menu = obj(s.menuSettings);
  return {
    businessName: s.tradeName,
    logoUrl: assetUrl(str(menu.logoUrl)),
    heroImageUrl: assetUrl(str(menu.heroImageUrl)),
    heroHeadline: str(menu.heroHeadline),
    whatsapp: s.whatsappNumber,
    phone: str(social.phone),
    address: s.address,
    instagramUrl: socialUrl(social.instagram ?? social.instagramUrl, "https://instagram.com/"),
    facebookUrl: socialUrl(social.facebook ?? social.facebookUrl, "https://facebook.com/"),
    openingHours: toOpeningHours(s.openingHours),
    acceptsDelivery: s.acceptsDelivery,
    acceptsPickup: s.acceptsPickup,
    deliveryFee: s.acceptsDelivery ? fromCents(s.deliveryFeeCents) : null,
    minimumOrder: s.minOrderCents > 0 ? fromCents(s.minOrderCents) : null,
    prepTimeMinutes: s.estimatedPrepMinutes,
    serviceMessage: str(s.defaultMessage) ?? str(menu.serviceMessage),
  };
}

/* ------------------------------------------------------------------ */
/* Administrador                                                       */
/* ------------------------------------------------------------------ */

export const toAdminUser = (a: ApiAdmin): AdminUser => ({ id: a.id, name: a.name, email: a.email, role: a.role, active: true });

/* ------------------------------------------------------------------ */
/* Carrinho e pedido                                                   */
/* ------------------------------------------------------------------ */

/** Itens no formato do backend. Nunca enviamos preço, total ou taxa: o servidor calcula tudo. */
export function toApiItems(items: OrderItemInput[]) {
  return items.map((i) => ({
    productId: i.productId,
    quantity: i.quantity,
    extras: [...new Set(i.addonIds)].map((extraId) => ({ extraId, quantity: 1 })),
    removedIngredients: i.removedIngredients,
    notes: i.notes,
  }));
}

export function toApiQuoteBody(items: OrderItemInput[], fulfillment: Fulfillment | undefined) {
  return { items: toApiItems(items), ...(fulfillment ? { fulfillmentType: FULFILLMENT_TO_API[fulfillment] } : {}) };
}

export function toCartQuote(q: ApiCartQuote, items: OrderItemInput[]): CartQuote {
  const lines: QuotedLine[] = q.lines.map((l) => {
    const input = items[l.index];
    return {
      key: input?.key ?? String(l.index),
      productId: l.productId,
      name: l.name ?? input?.name ?? "Item indisponível",
      imageUrl: assetUrl(l.imageUrl),
      available: l.available,
      quantity: l.quantity,
      unitPrice: fromCents(l.unitPriceCents),
      addons: l.extras.map((e) => ({
        id: e.extraId,
        name: e.quantity > 1 ? `${e.quantity}x ${e.name}` : e.name,
        price: fromCents(e.unitPriceCents * e.quantity),
      })),
      removedIngredients: l.removedIngredients,
      notes: l.notes ?? "",
      subtotal: fromCents(l.lineTotalCents),
      issue: l.issue,
    };
  });
  return {
    lines,
    subtotal: fromCents(q.subtotalCents),
    deliveryFee: q.deliveryFeeCents === null ? null : fromCents(q.deliveryFeeCents),
    total: fromCents(q.totalCents),
    minimumOrder: q.minOrderCents > 0 ? fromCents(q.minOrderCents) : null,
    canCheckout: q.canCheckout,
    issues: q.issues,
  };
}

/** O backend recebe o endereço como um único texto. */
export function formatAddress(a: NonNullable<CreateOrderPayload["address"]>): string {
  const complement = a.complement ? ` - ${a.complement}` : "";
  return `${a.street}, ${a.number}${complement}, ${a.district}, ${a.city}`;
}

export function toApiCreateOrder(p: CreateOrderPayload) {
  return {
    customer: p.customer,
    fulfillmentType: FULFILLMENT_TO_API[p.fulfillment],
    ...(p.fulfillment === "delivery" && p.address ? { deliveryAddress: formatAddress(p.address) } : {}),
    ...(p.fulfillment === "delivery" && p.reference ? { deliveryReference: p.reference } : {}),
    ...(p.notes ? { customerNotes: p.notes } : {}),
    items: toApiItems(p.items),
  };
}

function toOrderLine(i: ApiOrderItem): OrderLineView {
  return {
    name: i.productName,
    quantity: i.quantity,
    unitPrice: fromCents(i.unitPriceCents),
    subtotal: fromCents(i.lineTotalCents),
    addons: i.extras.map((e) => ({ name: e.quantity > 1 ? `${e.quantity}x ${e.name}` : e.name, price: fromCents(e.unitPriceCents * e.quantity) })),
    removedIngredients: i.removedIngredients,
    notes: i.notes,
  };
}

/**
 * Resposta de criação do pedido → `PublicOrder`. O endereço estruturado vem do que o próprio cliente acabou
 * de preencher (o backend só guarda o texto). O link do WhatsApp já vem pronto e é o preferido pela tela.
 */
export function toPublicOrder(r: ApiCreatedOrder, payload: CreateOrderPayload): PublicOrder {
  const o = r.order;
  return {
    id: o.publicId,
    number: o.orderNumber,
    status: toOrderStatus(o.status),
    fulfillment: toFulfillment(o.fulfillmentType),
    customerName: o.customerName,
    items: o.items.map(toOrderLine),
    subtotal: fromCents(o.subtotalCents),
    deliveryFee: fromCents(o.deliveryFeeCents),
    total: fromCents(o.totalCents),
    address: payload.fulfillment === "delivery" ? payload.address ?? null : null,
    reference: o.deliveryReference,
    notes: o.customerNotes,
    whatsappUrl: r.whatsapp.url,
    whatsappMessage: r.whatsapp.message,
  };
}
