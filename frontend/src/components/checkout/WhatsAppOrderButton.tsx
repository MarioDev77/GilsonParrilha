"use client";

import { useState } from "react";
import { MessageCircle, TriangleAlert } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";
import type { PublicOrder } from "@/types";
import { resolveWhatsAppUrl } from "@/utils/whatsapp";

export function WhatsAppOrderButton({ order, businessWhatsapp }: { order: PublicOrder; businessWhatsapp?: string }) {
  const [opened, setOpened] = useState(false);
  const url = resolveWhatsAppUrl(order, businessWhatsapp);

  if (!url) {
    return (
      <div role="alert" className="flex gap-3 rounded-sm border border-vinho-400/50 bg-vinho/15 p-4 text-sm">
        <TriangleAlert className="size-5 shrink-0 text-red-300" aria-hidden />
        <p>
          O WhatsApp da hamburgueria ainda não está configurado. Guarde o número do seu pedido (<strong>#{order.number}</strong>) e entre em contato com a loja.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => setOpened(true)}
        className={buttonClass("primary", "lg", "w-full bg-[#1F8F4E] hover:bg-[#187A42]")}
      >
        <MessageCircle className="size-5" aria-hidden />
        {opened ? "Abrir o WhatsApp de novo" : "Finalizar pedido pelo WhatsApp"}
        <span className="sr-only">(abre em nova aba)</span>
      </a>
      <p className="text-sm text-fumaca">
        Vamos abrir o WhatsApp com a mensagem pronta. <strong className="text-osso">Você precisa enviar a mensagem</strong> para concluir o contato com a hamburgueria.
      </p>
      {opened && (
        <p role="status" className="rounded-sm border border-cobre/40 bg-cobre/10 px-3 py-2 text-sm text-cobre-300">
          O WhatsApp foi aberto, mas o pedido só segue depois que você enviar a mensagem por lá. A equipe confirma o pedido pela conversa.
        </p>
      )}
    </div>
  );
}
