"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Bike, Clock } from "lucide-react";
import { Blaze } from "@/components/fx/Blaze";
import { FlameWrap } from "@/components/fx/FlameWrap";
import { buttonClass } from "@/components/ui/Button";
import { useSettings } from "@/context/SettingsContext";
import { formatBRL } from "@/utils/format";
import { OpenStatusBadge } from "./OpenStatusBadge";

const DEFAULT_HEADLINE = "Brasa de verdade, ingrediente que você reconhece.";

/** #D4561A (brasa) e #F08A55 (brasa-300) no formato 0–1 que o Canvas UI espera. */
const BRASA: [number, number, number] = [0.83, 0.34, 0.1];
const BRASA_CLARA: [number, number, number] = [0.94, 0.54, 0.33];

export function Hero() {
  const { settings } = useSettings();
  const reduce = useReducedMotion();
  const reveal = (i: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay: 0.1 + i * 0.12, ease: [0.2, 0.8, 0.2, 1] as const } };

  const deliveryInfo =
    settings?.acceptsDelivery && settings.deliveryFee !== null && settings.deliveryFee !== undefined
      ? settings.deliveryFee === 0
        ? "Entrega grátis"
        : `Entrega ${formatBRL(settings.deliveryFee)}`
      : null;

  return (
    <Blaze
      className="grelha min-h-[40rem] overflow-hidden border-b border-carvao-600 md:min-h-[36rem]"
      height={0.42}
      sparks={0.7}
      smoke={0.3}
      layers={3}
      sparkColor={BRASA}
      smokeColor={BRASA_CLARA}
    >
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-[1.15fr_0.85fr] md:py-24">
        <div>
          <motion.div {...reveal(0)} className="mb-5">
            <OpenStatusBadge />
          </motion.div>
          <motion.h1 {...reveal(0)} className="text-balance text-[clamp(3rem,9vw,6.5rem)] font-black uppercase leading-[0.88]">
            {settings?.heroHeadline || DEFAULT_HEADLINE}
          </motion.h1>
          <motion.p {...reveal(1)} className="mt-6 max-w-md text-lg text-osso/85">
            Hambúrgueres artesanais grelhados na hora, com pão, carne e molhos escolhidos um a um.
          </motion.p>
          <motion.div {...reveal(2)} className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-4">
            <FlameWrap className="inline-block" color={BRASA} radius={2} height={56} intensity={0.8} sparks={1}>
              {/* outline-offset negativo: o container do efeito tem overflow e cortaria o anel de foco */}
              <Link href="/cardapio" className={buttonClass("primary", "lg", "focus-visible:[outline-offset:-3px]")}>
                Ver cardápio
              </Link>
            </FlameWrap>
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-osso/80">
              {settings?.prepTimeMinutes ? (
                <li className="flex items-center gap-2">
                  <Clock className="size-4" aria-hidden /> Preparo em cerca de {settings.prepTimeMinutes} min
                </li>
              ) : null}
              {deliveryInfo ? (
                <li className="flex items-center gap-2">
                  <Bike className="size-4" aria-hidden /> {deliveryInfo}
                </li>
              ) : null}
            </ul>
          </motion.div>
        </div>

        {settings?.heroImageUrl ? (
          <motion.div {...reveal(1)} className="relative">
            <div className="absolute -inset-3 bg-brasa/25 blur-2xl" aria-hidden />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings.heroImageUrl}
              alt="Hambúrguer artesanal da casa"
              className="relative aspect-[4/5] w-full border border-cobre/40 object-cover md:aspect-square"
              fetchPriority="high"
            />
          </motion.div>
        ) : (
          <motion.div {...reveal(1)} className="relative mx-auto hidden w-full max-w-sm md:block" aria-hidden>
            <div className="absolute -inset-6 rounded-full bg-brasa/25 blur-3xl" />
            <Image
              src="/gilson-parrilha-logo.jpeg"
              alt=""
              width={480}
              height={480}
              priority
              className="relative aspect-square w-full rounded-full border border-cobre/60 object-cover shadow-[0_24px_80px_rgb(0_0_0/0.55)]"
            />
            <span className="absolute -bottom-3 right-2 -rotate-6 border border-brasa-300/60 bg-brasa px-4 py-2 font-display text-xl font-black uppercase leading-none tracking-wide text-white shadow-[0_8px_24px_rgb(0_0_0/0.5)]">
              Feito na brasa
            </span>
          </motion.div>
        )}
      </div>
    </Blaze>
  );
}
