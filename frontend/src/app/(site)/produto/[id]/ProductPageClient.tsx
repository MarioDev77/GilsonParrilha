"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ProductDetails } from "@/components/products/ProductDetails";
import { Skeleton, ErrorState } from "@/components/ui/States";
import { useCart } from "@/context/CartContext";
import { useAsync } from "@/hooks/useAsync";
import { productsService } from "@/services/products";
import { ApiError } from "@/services/http";

export function ProductPageClient() {
  const { id } = useParams<{ id: string }>();
  const editKey = useSearchParams().get("editar");
  const { lines, hydrated } = useCart();
  const { data: product, loading, error, reload } = useAsync((s) => productsService.get(id, s), [id]);
  const editingLine = editKey && hydrated ? lines.find((l) => l.key === editKey && l.productId === id) : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/cardapio" className="mb-6 inline-flex items-center gap-1 text-sm text-fumaca hover:text-osso">
        <ChevronLeft className="size-4" aria-hidden /> Voltar ao cardápio
      </Link>
      {loading ? (
        <div className="grid gap-8 md:grid-cols-2" role="status" aria-label="Carregando produto">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      ) : error ? (
        <ErrorState
          error={error}
          onRetry={reload}
          title={error instanceof ApiError && error.status === 404 ? "Produto não encontrado" : undefined}
        />
      ) : product ? (
        <ProductDetails key={`${product.id}:${editingLine?.key ?? "novo"}`} product={product} editingLine={editingLine} />
      ) : null}
    </div>
  );
}
