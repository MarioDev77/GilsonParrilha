import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main id="conteudo" className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="font-display text-8xl font-black text-brasa">404</p>
        <h1 className="mt-2 text-4xl font-bold">Página não encontrada</h1>
        <p className="mt-2 text-fumaca">O endereço que você abriu não existe ou foi movido.</p>
        <Link href="/" className={buttonClass("primary", "md", "mt-6")}>
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
