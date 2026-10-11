"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/context/CartContext";
import { ordersService } from "@/services/orders";
import type { CartQuote, Fulfillment, OrderItemInput } from "@/types";
import { useDebounce } from "./useDebounce";

/** Pede ao backend os preços oficiais e a validade dos itens do carrinho. */
export function useCartQuote(fulfillment?: Fulfillment) {
  const { lines, hydrated } = useCart();
  const items = useMemo<OrderItemInput[]>(
    () =>
      lines.map((l) => ({
        key: l.key,
        name: l.name,
        productId: l.productId,
        quantity: l.quantity,
        addonIds: l.addonIds,
        removedIngredients: l.removedIngredients,
        notes: l.notes,
      })),
    [lines]
  );
  const payloadKey = useDebounce(JSON.stringify({ items, fulfillment }), 250);
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!hydrated) return;
    const parsed = JSON.parse(payloadKey) as { items: OrderItemInput[]; fulfillment?: Fulfillment };
    if (parsed.items.length === 0) {
      setQuote(null);
      setError(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    ordersService
      .quote(parsed.items, parsed.fulfillment, controller.signal)
      .then((q) => {
        if (controller.signal.aborted) return;
        setQuote(q);
        setLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err);
        setLoading(false);
      });
    return () => controller.abort();
  }, [payloadKey, hydrated, tick]);

  const stale = JSON.stringify({ items, fulfillment }) !== payloadKey;
  return { quote, error, loading: loading || stale, retry: () => setTick((t) => t + 1) };
}
