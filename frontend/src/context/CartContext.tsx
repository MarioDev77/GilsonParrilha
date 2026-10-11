"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { CART_STORAGE_KEY } from "@/config/site";
import type { CartLine } from "@/types";
import { newId } from "@/utils/format";

export const MAX_LINE_QUANTITY = 20;

export type NewCartLine = Omit<CartLine, "key">;

type Action =
  | { type: "hydrate"; lines: CartLine[] }
  | { type: "add"; line: NewCartLine }
  | { type: "replace"; key: string; line: NewCartLine }
  | { type: "quantity"; key: string; quantity: number }
  | { type: "remove"; key: string }
  | { type: "clear" };

const signature = (l: NewCartLine) =>
  [l.productId, [...l.addonIds].sort().join(","), [...l.removedIngredients].sort().join(","), l.notes.trim()].join("|");

const clampQty = (n: number) => Math.min(MAX_LINE_QUANTITY, Math.max(1, Math.floor(n) || 1));

function reducer(state: CartLine[], action: Action): CartLine[] {
  switch (action.type) {
    case "hydrate":
      return action.lines;
    case "add": {
      const sig = signature(action.line);
      const existing = state.find((l) => signature(l) === sig);
      if (existing) {
        return state.map((l) => (l.key === existing.key ? { ...l, quantity: clampQty(l.quantity + action.line.quantity) } : l));
      }
      return [...state, { ...action.line, quantity: clampQty(action.line.quantity), key: newId() }];
    }
    case "replace": {
      const sig = signature(action.line);
      const other = state.find((l) => l.key !== action.key && signature(l) === sig);
      if (other) {
        return state
          .filter((l) => l.key !== action.key)
          .map((l) => (l.key === other.key ? { ...l, quantity: clampQty(l.quantity + action.line.quantity) } : l));
      }
      return state.map((l) => (l.key === action.key ? { ...action.line, quantity: clampQty(action.line.quantity), key: l.key } : l));
    }
    case "quantity":
      return state.map((l) => (l.key === action.key ? { ...l, quantity: clampQty(action.quantity) } : l));
    case "remove":
      return state.filter((l) => l.key !== action.key);
    case "clear":
      return [];
  }
}

function sanitize(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const out: CartLine[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    if (typeof o.productId !== "string" || typeof o.key !== "string") continue;
    out.push({
      key: o.key,
      productId: o.productId,
      name: typeof o.name === "string" ? o.name : "Produto",
      quantity: clampQty(Number(o.quantity)),
      addonIds: Array.isArray(o.addonIds) ? o.addonIds.filter((x): x is string => typeof x === "string") : [],
      removedIngredients: Array.isArray(o.removedIngredients)
        ? o.removedIngredients.filter((x): x is string => typeof x === "string")
        : [],
      notes: typeof o.notes === "string" ? o.notes.slice(0, 200) : "",
    });
  }
  return out;
}

interface CartState {
  lines: CartLine[];
  count: number;
  hydrated: boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addLine: (line: NewCartLine) => void;
  replaceLine: (key: string, line: NewCartLine) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  clear: () => void;
}

const Ctx = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, dispatch] = useReducer(reducer, []);
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const skipFirstWrite = useRef(true);

  // Carrinho temporário no navegador: guarda apenas escolhas do cliente, nunca preços.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) dispatch({ type: "hydrate", lines: sanitize(JSON.parse(raw)) });
    } catch {
      /* armazenamento indisponível ou corrompido: começa vazio */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipFirstWrite.current) {
      skipFirstWrite.current = false;
      return;
    }
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* ignora quota/modo privado */
    }
  }, [lines, hydrated]);

  // Sincroniza abas abertas.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== CART_STORAGE_KEY) return;
      try {
        dispatch({ type: "hydrate", lines: e.newValue ? sanitize(JSON.parse(e.newValue)) : [] });
      } catch {
        /* ignora */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addLine = useCallback((line: NewCartLine) => dispatch({ type: "add", line }), []);
  const replaceLine = useCallback((key: string, line: NewCartLine) => dispatch({ type: "replace", key, line }), []);
  const setQuantity = useCallback((key: string, quantity: number) => dispatch({ type: "quantity", key, quantity }), []);
  const removeLine = useCallback((key: string) => dispatch({ type: "remove", key }), []);
  const clear = useCallback(() => dispatch({ type: "clear" }), []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const value = useMemo<CartState>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      hydrated,
      drawerOpen,
      openDrawer,
      closeDrawer,
      addLine,
      replaceLine,
      setQuantity,
      removeLine,
      clear,
    }),
    [lines, hydrated, drawerOpen, openDrawer, closeDrawer, addLine, replaceLine, setQuantity, removeLine, clear]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart deve ser usado dentro de CartProvider");
  return ctx;
}
