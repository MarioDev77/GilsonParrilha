"use client";

import { ExternalLink, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/States";
import { useSettings } from "@/context/SettingsContext";
import { formatBRL } from "@/utils/format";
import { waLink } from "@/utils/whatsapp";

export function BusinessInfo() {
  const { settings, loading } = useSettings();

  return (
    <section className="mx-auto mt-24 max-w-6xl px-4" aria-label="Funcionamento e contato">
      <div className="grid gap-10 md:grid-cols-2">
        <div id="horarios" className="scroll-mt-24">
          <h2 className="text-4xl font-black">Horário de funcionamento</h2>
          {loading ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          ) : settings && settings.openingHours.length > 0 ? (
            <dl className="mt-4 divide-y divide-carvao-600 border-y border-carvao-600">
              {settings.openingHours.map((h) => (
                <div key={h.day} className="flex justify-between gap-4 py-3">
                  <dt className="font-semibold">{h.day}</dt>
                  <dd className="text-fumaca">{h.hours}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-4 text-fumaca">Os horários ainda não foram informados.</p>
          )}
          {settings?.serviceMessage && <p className="mt-4 text-sm text-fumaca">{settings.serviceMessage}</p>}
        </div>

        <div id="contato" className="scroll-mt-24">
          <h2 className="text-4xl font-black">Onde estamos</h2>
          <ul className="mt-4 space-y-4">
            {settings?.address && (
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-cobre-300" aria-hidden />
                <span>{settings.address}</span>
              </li>
            )}
            {settings?.phone && (
              <li className="flex gap-3">
                <Phone className="mt-0.5 size-5 shrink-0 text-cobre-300" aria-hidden />
                <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`} className="hover:text-cobre-300">
                  {settings.phone}
                </a>
              </li>
            )}
            {settings?.instagramUrl && (
              <li>
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-cobre-300">
                  Instagram <ExternalLink className="size-3.5" aria-hidden />
                  <span className="sr-only">(abre em nova aba)</span>
                </a>
              </li>
            )}
            {settings?.facebookUrl && (
              <li>
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-cobre-300">
                  Facebook <ExternalLink className="size-3.5" aria-hidden />
                  <span className="sr-only">(abre em nova aba)</span>
                </a>
              </li>
            )}
          </ul>
          {settings && (settings.address || settings.whatsapp) ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {settings.address && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass("primary", "md")}
                >
                  <Navigation className="size-4" aria-hidden /> Como chegar
                  <span className="sr-only">(abre em nova aba)</span>
                </a>
              )}
              {settings.whatsapp && (
                <a
                  href={waLink(settings.whatsapp, "Olá! Vim pelo site.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass("secondary", "md")}
                >
                  <MessageCircle className="size-4" aria-hidden /> Chamar no WhatsApp
                  <span className="sr-only">(abre em nova aba)</span>
                </a>
              )}
            </div>
          ) : null}
          {settings && (settings.minimumOrder || settings.deliveryFee) ? (
            <p className="mt-6 text-sm text-fumaca">
              {settings.deliveryFee ? `Taxa de entrega: ${formatBRL(settings.deliveryFee)}. ` : ""}
              {settings.minimumOrder ? `Pedido mínimo: ${formatBRL(settings.minimumOrder)}.` : ""}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
