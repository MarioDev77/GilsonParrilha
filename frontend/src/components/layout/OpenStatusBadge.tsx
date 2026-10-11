"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/context/SettingsContext";
import { cn } from "@/utils/cn";
import { getOpenStatus, type OpenStatus } from "@/utils/openStatus";

/** Selo "Aberto agora / Fechado". Só aparece depois de montar (usa a hora atual) e some se o horário não puder ser interpretado. */
export function OpenStatusBadge({ className }: { className?: string }) {
  const { settings } = useSettings();
  const [status, setStatus] = useState<OpenStatus | null>(null);
  const hours = settings?.openingHours;

  useEffect(() => {
    if (!hours) return;
    const update = () => setStatus(getOpenStatus(hours));
    update();
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, [hours]);

  if (!status) return null;
  return (
    <p
      role="status"
      className={cn(
        "inline-flex items-center gap-2.5 rounded-sm border bg-carvao/70 px-3 py-1.5 text-sm font-semibold backdrop-blur-sm",
        status.open ? "border-emerald-400/40 text-osso" : "border-carvao-600 text-fumaca",
        className
      )}
    >
      <span className="relative flex size-2.5" aria-hidden>
        {status.open && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70" />}
        <span className={cn("relative inline-flex size-2.5 rounded-full", status.open ? "bg-emerald-400" : "bg-fumaca/70")} />
      </span>
      {status.text}
    </p>
  );
}
