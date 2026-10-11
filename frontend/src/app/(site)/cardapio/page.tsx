import type { Metadata } from "next";
import { Suspense } from "react";
import { MenuView } from "@/components/products/MenuView";
import { ProductGridSkeleton } from "@/components/products/ProductCard";

export const metadata: Metadata = { title: "Cardápio" };

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10">
          <ProductGridSkeleton />
        </div>
      }
    >
      <MenuView />
    </Suspense>
  );
}
