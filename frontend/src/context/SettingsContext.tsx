"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAsync } from "@/hooks/useAsync";
import { settingsService } from "@/services/settings";
import type { PublicSettings } from "@/types";

interface SettingsState {
  settings: PublicSettings | null;
  loading: boolean;
  error: unknown;
  reload: () => void;
}

const Ctx = createContext<SettingsState | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { data, loading, error, reload } = useAsync((s) => settingsService.getPublic(s), []);
  return <Ctx.Provider value={{ settings: data, loading, error, reload }}>{children}</Ctx.Provider>;
}

export function useSettings(): SettingsState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSettings deve ser usado dentro de SettingsProvider");
  return ctx;
}
