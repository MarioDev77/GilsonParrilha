"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Options {
  /** Atualização silenciosa periódica (não mostra skeleton nem erro). */
  refreshMs?: number;
  enabled?: boolean;
}

export function useAsync<T>(fn: (signal: AbortSignal) => Promise<T>, deps: unknown[], options: Options = {}) {
  const { refreshMs, enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(enabled);
  const [tick, setTick] = useState(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const reload = useCallback(() => setTick((t) => t + 1), []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fnRef
      .current(controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err);
        setLoading(false);
      });
    return () => controller.abort();
  }, [...deps, tick, enabled]);

  useEffect(() => {
    if (!refreshMs || !enabled) return;
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const controller = new AbortController();
      fnRef
        .current(controller.signal)
        .then((res) => setData(res))
        .catch(() => undefined);
    }, refreshMs);
    return () => clearInterval(id);
  }, [refreshMs, enabled]);

  return { data, error, loading, reload, setData };
}
