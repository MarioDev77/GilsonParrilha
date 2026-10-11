"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

export function BrandIntro() {
  const [visible, setVisible] = useState(true);
  const reduce = useReducedMotion();

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 1700);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="brand-intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: reduce ? 0.01 : 0.45, ease: "easeInOut" } }}
          aria-label="Bem vindo a Gilson Parrilha"
          role="status"
        >
          <div className="brand-intro__glow" aria-hidden="true" />
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.92, y: 10 }}
            animate={reduce ? {} : { opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex flex-col items-center text-center"
          >
            <Image src="/gilson-parrilha-logo.jpeg" alt="Logo Gilson Parrilha" width={240} height={240} priority className="brand-intro__logo" />
            <p className="mt-7 font-display text-[clamp(1.8rem,6vw,3.25rem)] font-semibold uppercase tracking-[0.08em] text-osso">
              Bem vindo a <span className="text-cobre-300">Gilson Parrilha</span>
            </p>
            <span className="mt-3 text-[0.65rem] font-semibold uppercase tracking-[0.42em] text-fumaca">Hamburgueria &amp; Salgadaria</span>
          </motion.div>
          <div className="brand-intro__embers" aria-hidden="true" />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function EmberField() {
  return <div className="ember-field" aria-hidden="true"><span /><span /><span /><span /><span /></div>;
}

export function BrandLogoImage({ className = "" }: { className?: string }) {
  return <Image src="/gilson-parrilha-logo.jpeg" alt="Gilson Parrilha" width={64} height={64} className={className} />;
}

export const brandLogoPath = "/gilson-parrilha-logo.jpeg";

export default BrandIntro;
