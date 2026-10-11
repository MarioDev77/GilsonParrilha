"use client";

import { useMemo } from "react";
import { categoriesService } from "@/services/categories";
import { productsService } from "@/services/products";
import { useAsync } from "./useAsync";

export function useMenu() {
  const { data, loading, error, reload } = useAsync(
    async (signal) => {
      const [categories, products] = await Promise.all([categoriesService.list(signal), productsService.list({}, signal)]);
      return { categories, products };
    },
    []
  );
  const categories = useMemo(
    () => (data?.categories ?? []).filter((c) => c.active).sort((a, b) => a.order - b.order),
    [data]
  );
  return { categories, products: data?.products ?? [], loading, error, reload };
}
