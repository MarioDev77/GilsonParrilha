"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Clock } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { buttonClass } from "@/components/ui/Button";
import { EmberField } from "./BrandIntro";

const DEFAULT_HEADLINE = "Brasa de verdade, ingrediente que você reconhece.";

export function Hero() {
  const { settings } = useSettings();
  const reduce = useReducedMotion();
  const reveal = (i: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay: 0.1 + i * 0.12, ease: [0.2, 0.8, 0.2, 1] as const } };

  return (
    <section className="grelha relative overflow-hidden border-b border-carvao-600">
      <EmberField />
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-[1.15fr_0.85fr] md:py-24">
        <div>
          <motion.h1 {...reveal(0)} className="text-balance text-[clamp(3rem,9vw,6.5rem)] font-black uppercase leading-[0.88]">
            {settings?.heroHeadline || DEFAULT_HEADLINE}
          </motion.h1>
          <motion.p {...reveal(1)} className="mt-6 max-w-md text-lg text-osso/85">
            Hambúrgueres artesanais grelhados na hora, com pão, carne e molhos escolhidos um a um.
          </motion.p>
          <motion.div {...reveal(2)} className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/cardapio" className={buttonClass("primary", "lg")}>
              Ver cardápio
            </Link>
            {settings?.prepTimeMinutes ? (
              <span className="flex items-center gap-2 text-sm text-osso/80">
                <Clock className="size-4" aria-hidden /> Preparo em cerca de {settings.prepTimeMinutes} min
              </span>
            ) : null}
          </motion.div>
        </div>

        {settings?.heroImageUrl && (
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
        )}
      </div>
    </section>
  );
}
