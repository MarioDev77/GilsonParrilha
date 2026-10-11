import type { Metadata } from "next";
import Link from "next/link";
import { CartContents } from "@/components/cart/CartContents";

export const metadata: Metadata = { title: "Carrinho" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-5xl font-black">Seu carrinho</h1>
      <div className="mt-6">
        <CartContents />
      </div>
      <Link href="/cardapio" className="mt-6 inline-block text-sm text-fumaca hover:text-osso">
        Continuar escolhendo
      </Link>
    </div>
  );
}
