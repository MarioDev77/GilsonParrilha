"use client";

import Link from "next/link";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { HOME_SECTIONS } from "@/config/site";
import { useMenu } from "@/hooks/useMenu";
import type { Product } from "@/types";
import { ProductCard, ProductGridSkeleton } from "./ProductCard";

function Section({ title, products, href }: { title: string; products: Product[]; href: string }) {
  if (products.length === 0) return null;
  return (
    <section className="mx-auto mt-20 max-w-6xl px-4" aria-label={title}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="text-4xl font-black md:text-5xl">{title}</h2>
        <Link href={href} className="shrink-0 pb-1 text-sm font-semibold text-cobre-300 hover:text-cobre">
          Ver no cardápio
        </Link>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.slice(0, 6).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

export function HomeMenu() {
  const { categories, products, loading, error, reload } = useMenu();

  if (loading) {
    return (
      <div className="mx-auto mt-20 max-w-6xl px-4">
        <ProductGridSkeleton count={3} />
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto mt-20 max-w-6xl px-4">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }
  if (products.length === 0) {
    return (
      <div className="mx-auto mt-20 max-w-6xl px-4">
        <EmptyState title="O cardápio está sendo preparado" description="Ainda não há produtos cadastrados. Volte em breve." />
      </div>
    );
  }

  const featured = products.filter((p) => p.featured);

  return (
    <>
      <Section title="Os mais pedidos" products={featured} href="/cardapio" />
      {HOME_SECTIONS.map((section) => {
        const cats = categories.filter((c) => (section.slugs as readonly string[]).includes(c.slug));
        const ids = new Set(cats.map((c) => c.id));
        return (
          <Section
            key={section.id}
            title={section.title}
            products={products.filter((p) => ids.has(p.categoryId))}
            href={cats[0] ? `/cardapio?categoria=${encodeURIComponent(cats[0].slug)}` : "/cardapio"}
          />
        );
      })}
    </>
  );
}
