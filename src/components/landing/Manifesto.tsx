"use client";

import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";
import { PetalCluster } from "@/components/fx/Petals";
import { useI18n } from "@/i18n/I18nProvider";

const ICONS = [
  // Menos plástico: botella tachada
  <path key="a" d="M10 3h4v3l2 3v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3V3ZM4 4l16 16" />,
  // Menos volumen: compresión
  <path key="b" d="M4 9h16M4 15h16M12 3v4m0 0-2-2m2 2 2-2M12 21v-4m0 0-2 2m2-2 2 2" />,
  // Dosis exacta: tijera sobre marca
  <path key="c" d="M12 2v20M6 6a2 2 0 1 0 0 .01M6 18a2 2 0 1 0 0 .01M7.5 7.5 18 16M7.5 16.5 18 8" />,
];

export function Manifesto() {
  const { d } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = d.manifesto.line.split(" ");

  return (
    <section id="beneficios" className="relative mx-auto max-w-7xl scroll-mt-24 px-5 py-20 sm:px-8 sm:py-32 lg:py-40">
      <p className="mb-8 text-xs font-bold uppercase tracking-[0.3em] text-sky-deep">{d.manifesto.kicker}</p>
      <div ref={ref} className="relative">
        <PetalCluster className="-top-14 right-0 lg:right-[6%]" />
        <h2 className="max-w-5xl font-display text-[clamp(1.9rem,4.6vw,4rem)] font-bold leading-[1.08] tracking-[-0.03em] text-ink">
          {words.map((w, i) => (
            <Word key={`${w}-${i}`} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
              {w}
            </Word>
          ))}
        </h2>
      </div>

      <div className="mt-14 grid gap-4 sm:mt-20 md:grid-cols-[1.3fr_1fr_1fr]">
        {d.manifesto.pillars.map((p, i) => (
          <motion.article
            key={p.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }}
            className={`card p-7 ${i === 0 ? "md:row-span-1 md:p-9" : ""}`}
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-soft text-sky-deep">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {ICONS[i]}
              </svg>
            </span>
            <h3 className={`mt-6 font-display font-bold tracking-tight text-ink ${i === 0 ? "text-3xl" : "text-2xl"}`}>{p.title}</h3>
            <p className="mt-3 leading-relaxed text-ink-soft">{p.text}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.22, 1]);
  return (
    <motion.span style={{ opacity }} className="mr-[0.25em] inline-block">
      {children}
    </motion.span>
  );
}
