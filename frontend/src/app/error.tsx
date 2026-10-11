"use client";

import { Button } from "@/components/ui/Button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="conteudo" className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <h1 className="text-4xl font-bold">Algo deu errado</h1>
        <p className="mt-2 text-fumaca">Não foi possível exibir esta página. Tente novamente.</p>
        <Button className="mt-6" onClick={reset}>
          Tentar de novo
        </Button>
      </div>
    </main>
  );
}
