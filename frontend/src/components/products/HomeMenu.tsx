"use client";

import Link from "next/link";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { HOME_SECTIONS } from "@/config/site";
import { useMenu } from "@/hooks/useMenu";
import type { Product } from "@/types";
import { cn } from "@/utils/cn";
import { ProductCard, ProductGridSkeleton } from "./ProductCard";

interface Block {
  key: string;
  title: string;
  products: Product[];
  href: string;
  /** Faixa de destaque em largura total, para quebrar a repetição título + grade. */
  band?: boolean;
}

/** Barras de grelha que somem nas pontas: separa seções sem repetir o mesmo bloco. */
function GrillDivider() {
  return (
    <div className="mx-auto mt-16 max-w-6xl px-4" aria-hidden>
      <div className="h-3 bg-[repeating-linear-gradient(90deg,#3A302A_0_14px,transparent_14px_20px)] [mask-image:linear-gradient(90deg,transparent,#000_18%,#000_82%,transparent)]" />
    </div>
  );
}

function Section({ block, spaced }: { block: Block; spaced: boolean }) {
  const { title, products, href, band } = block;
  const content = (
    <div className="mx-auto max-w-6xl px-4">
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
    </div>
  );

  if (band) {
    return (
      <section className="grelha-fina mt-20 border-y border-carvao-600 bg-carvao-800 py-14" aria-label={title}>
        {content}
      </section>
    );
  }
  return (
    <section className={cn(spaced ? "mt-12" : "mt-20")} aria-label={title}>
      {content}
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

  const blocks: Block[] = [
    { key: "mais-pedidos", title: "Os mais pedidos", products: products.filter((p) => p.featured), href: "/cardapio", band: true },
    ...HOME_SECTIONS.map((section) => {
      const cats = categories.filter((c) => (section.slugs as readonly string[]).includes(c.slug));
      const ids = new Set(cats.map((c) => c.id));
      return {
        key: section.id,
        title: section.title,
        products: products.filter((p) => ids.has(p.categoryId)),
        href: cats[0] ? `/cardapio?categoria=${encodeURIComponent(cats[0].slug)}` : "/cardapio",
      };
    }),
  ].filter((b) => b.products.length > 0);

  return (
    <>
      {blocks.map((block, i) => {
        const prev = blocks[i - 1];
        // divisor só entre duas seções comuns; a faixa de destaque já separa por si só
        const divider = i > 0 && !block.band && !prev.band;
        return (
          <div key={block.key}>
            {divider && <GrillDivider />}
            <Section block={block} spaced={divider} />
          </div>
        );
      })}
    </>
  );
}
