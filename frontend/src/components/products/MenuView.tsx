"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SearchX } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useMenu } from "@/hooks/useMenu";
import { Button } from "@/components/ui/Button";
import { CategoryNavigation } from "./CategoryNavigation";
import { ProductCard, ProductGridSkeleton } from "./ProductCard";
import { SearchBar } from "./SearchBar";

const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function MenuView() {
  const { categories, products, loading, error, reload } = useMenu();
  const params = useSearchParams();
  const [categoryId, setCategoryId] = useState("");
  const [query, setQuery] = useState("");
  const appliedSlug = useRef(false);

  useEffect(() => {
    const slug = params.get("categoria");
    if (appliedSlug.current || !slug || categories.length === 0) return;
    const match = categories.find((c) => c.slug === slug);
    if (match) setCategoryId(match.id);
    appliedSlug.current = true;
  }, [params, categories]);

  const groups = useMemo(() => {
    const q = normalize(query);
    return categories
      .filter((c) => !categoryId || c.id === categoryId)
      .map((c) => ({
        category: c,
        items: products.filter((p) => p.categoryId === c.id && (!q || normalize(p.name).includes(q))),
      }))
      .filter((g) => g.items.length > 0);
  }, [categories, products, categoryId, query]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-5xl font-black md:text-6xl">Cardápio</h1>

      <div className="sticky top-16 z-20 -mx-4 mt-6 space-y-3 border-b border-carvao-600 bg-carvao/95 px-4 pb-3 pt-3 backdrop-blur">
        <SearchBar value={query} onChange={setQuery} />
        <CategoryNavigation categories={categories} value={categoryId} onChange={setCategoryId} />
      </div>

      <div className="mt-8">
        {loading ? (
          <ProductGridSkeleton />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : groups.length === 0 ? (
          <EmptyState
            icon={<SearchX className="size-9" aria-hidden />}
            title={query ? "Nenhum lanche com esse nome" : "Nada por aqui ainda"}
            description={query ? "Confira a grafia ou limpe a busca para ver tudo." : "Esta categoria ainda não tem produtos."}
            action={
              (query || categoryId) && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery("");
                    setCategoryId("");
                  }}
                >
                  Limpar filtros
                </Button>
              )
            }
          />
        ) : (
          <div className="space-y-14">
            {groups.map(({ category, items }) => (
              <section key={category.id} aria-labelledby={`cat-${category.id}`}>
                <h2 id={`cat-${category.id}`} className="mb-5 text-3xl font-bold md:text-4xl">
                  {category.name}
                </h2>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
