/**
 * Modelos usados pelas telas. Valores monetários em REAIS (number, ex.: 32.9).
 * O backend trabalha em centavos, com outros nomes de campo e enums; a conversão fica toda em
 * `services/mappers.ts`, então as telas não conhecem o formato da API.
 */

export type Fulfillment = "delivery" | "pickup";

export type OrderStatus =
  | "awaiting_whatsapp"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "completed"
  | "cancelled";

export interface Category {
  id: string;
  name: string;
  slug: string;
  /** O backend já devolve as categorias ordenadas; aqui é a posição na lista. */
  order: number;
  active: boolean;
  productCount?: number;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

export type ProductBadge = "mais_pedido" | "novidade" | null;

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  ingredients: string[];
  removableIngredients: string[];
  price: number;
  imageUrl: string | null;
  categoryId: string;
  categoryName?: string;
  available: boolean;
  featured: boolean;
  badge: ProductBadge;
  /** Adicionais completos só vêm no detalhe do produto; a lista traz apenas `hasAddons`. */
  addons: Addon[];
  hasAddons?: boolean;
}

export interface OpeningHour {
  day: string;
  hours: string;
}

export interface PublicSettings {
  businessName: string;
  logoUrl: string | null;
  heroImageUrl: string | null;
  heroHeadline: string | null;
  whatsapp: string; // somente dígitos com DDI, ex.: 5575999999999
  phone: string | null;
  address: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  openingHours: OpeningHour[];
  acceptsDelivery: boolean;
  acceptsPickup: boolean;
  deliveryFee: number | null;
  minimumOrder: number | null;
  prepTimeMinutes: number | null;
  serviceMessage: string | null;
}

/** Linha do carrinho guardada no navegador: somente escolhas, nunca preços. */
export interface CartLine {
  key: string;
  productId: string;
  name: string;
  quantity: number;
  addonIds: string[];
  removedIngredients: string[];
  notes: string;
}

export interface OrderItemInput {
  /** Só para casar a resposta da cotação com a linha do carrinho; nunca é enviado ao backend. */
  key?: string;
  /** Só para exibir um nome quando o produto não existe mais; nunca é enviado ao backend. */
  name?: string;
  productId: string;
  quantity: number;
  addonIds: string[];
  removedIngredients: string[];
  notes: string;
}

export interface QuotedLine {
  key: string;
  productId: string;
  name: string;
  imageUrl: string | null;
  available: boolean;
  quantity: number;
  unitPrice: number;
  addons: { id: string; name: string; price: number }[];
  removedIngredients: string[];
  notes: string;
  subtotal: number;
  issue?: string | null;
}

export interface CartQuote {
  lines: QuotedLine[];
  subtotal: number;
  deliveryFee: number | null;
  total: number;
  minimumOrder: number | null;
  canCheckout: boolean;
  issues: string[];
}

export interface CustomerAddress {
  street: string;
  number: string;
  district: string;
  city: string;
  complement?: string;
}

export interface CreateOrderPayload {
  customer: { name: string; phone: string };
  fulfillment: Fulfillment;
  address?: CustomerAddress;
  reference?: string;
  notes?: string;
  items: OrderItemInput[];
}

export interface OrderLineView {
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  addons: { name: string; price: number }[];
  removedIngredients: string[];
  notes?: string | null;
}

export interface PublicOrder {
  id: string;
  number: string | number;
  status: OrderStatus;
  fulfillment: Fulfillment;
  customerName: string;
  items: OrderLineView[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  address?: CustomerAddress | null;
  reference?: string | null;
  notes?: string | null;
  /** URL completa do WhatsApp preparada pelo backend (preferida). */
  whatsappUrl?: string | null;
  /** Texto pronto da mensagem (usado com o número configurado se não houver URL). */
  whatsappMessage?: string | null;
}

/* ---------- Admin ---------- */

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

export interface AdminRole {
  id: string;
  label: string;
}

export interface AdminOrderSummary {
  id: string;
  number: string | number;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  fulfillment: Fulfillment;
  total: number;
  createdAt: string;
}

export interface AdminOrderDetail extends AdminOrderSummary {
  items: OrderLineView[];
  subtotal: number;
  deliveryFee: number;
  address?: CustomerAddress | null;
  reference?: string | null;
  notes?: string | null;
  internalNotes?: string | null;
  cancelReason?: string | null;
  allowedTransitions: OrderStatus[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DashboardData {
  ordersToday: number;
  byStatus: Partial<Record<OrderStatus, number>>;
  revenue: number;
  revenueCriterion?: string;
  topProducts: { name: string; quantity: number }[];
  ordersByPeriod: { date: string; count: number }[];
}

export interface AdminSettings extends PublicSettings {}

export interface ProductInput {
  name: string;
  description: string;
  ingredients: string[];
  removableIngredients: string[];
  price: number;
  categoryId: string;
  available: boolean;
  featured: boolean;
  badge: ProductBadge;
  imageUrl: string | null;
  addons: { id?: string; name: string; price: number; available: boolean }[];
}

export interface CategoryInput {
  name: string;
  active: boolean;
}
