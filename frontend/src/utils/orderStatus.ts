import type { OrderStatus } from "@/types";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  awaiting_whatsapp: "Aguardando contato pelo WhatsApp",
  confirmed: "Confirmado",
  preparing: "Em preparação",
  ready: "Pronto para retirada ou envio",
  out_for_delivery: "Saiu para entrega",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export const ORDER_STATUS_SHORT: Record<OrderStatus, string> = {
  awaiting_whatsapp: "Aguardando contato",
  confirmed: "Confirmado",
  preparing: "Em preparação",
  ready: "Pronto",
  out_for_delivery: "Saiu para entrega",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export const ORDER_STATUS_STYLE: Record<OrderStatus, string> = {
  awaiting_whatsapp: "bg-cobre/15 text-cobre-300 ring-cobre/40",
  confirmed: "bg-sky-500/15 text-sky-300 ring-sky-400/40",
  preparing: "bg-brasa/15 text-brasa-300 ring-brasa/40",
  ready: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/40",
  out_for_delivery: "bg-violet-500/15 text-violet-300 ring-violet-400/40",
  completed: "bg-emerald-600/20 text-emerald-200 ring-emerald-400/50",
  cancelled: "bg-vinho/30 text-red-300 ring-vinho-400/60",
};

export const ALL_STATUSES = Object.keys(ORDER_STATUS_LABEL) as OrderStatus[];
