"use client";

import { ExternalLink, MapPin, Phone } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { Logo } from "./Logo";

export function Footer() {
  const { settings } = useSettings();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-carvao-600 bg-carvao-800 pb-28 md:pb-0">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[1.3fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo logoUrl={settings?.logoUrl} name={settings?.businessName} />
          <p className="max-w-xs text-sm text-fumaca">Hambúrgueres artesanais feitos na brasa, com ingredientes selecionados.</p>
        </div>
        <div className="space-y-2 text-sm">
          <h2 className="text-xl font-bold">Contato</h2>
          {settings?.address && (
            <p className="flex items-start gap-2 text-fumaca">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden /> {settings.address}
            </p>
          )}
          {settings?.phone && (
            <p className="flex items-center gap-2 text-fumaca">
              <Phone className="size-4 shrink-0" aria-hidden />
              <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`} className="hover:text-osso">
                {settings.phone}
              </a>
            </p>
          )}
        </div>
        <div className="space-y-2 text-sm">
          <h2 className="text-xl font-bold">Redes sociais</h2>
          {settings?.instagramUrl && (
            <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-fumaca hover:text-osso">
              Instagram <ExternalLink className="size-3.5" aria-hidden />
              <span className="sr-only">(abre em nova aba)</span>
            </a>
          )}
          {settings?.facebookUrl && (
            <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-fumaca hover:text-osso">
              Facebook <ExternalLink className="size-3.5" aria-hidden />
              <span className="sr-only">(abre em nova aba)</span>
            </a>
          )}
          {!settings?.instagramUrl && !settings?.facebookUrl && <p className="text-fumaca">Em breve.</p>}
        </div>
      </div>
      <div className="border-t border-carvao-600 py-4 text-center text-xs text-fumaca">
        © {year} {settings?.businessName ?? "Gilson Parrilha"}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
