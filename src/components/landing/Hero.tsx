"use client";

import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { SheetCard } from "./SheetCard";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Hojas flotando en 3D: posición, inclinación y profundidad de cada una. */
const FLOATERS = [
  { x: "8%", y: "14%", w: 300, rx: 18, ry: -24, rz: -10, depth: 1, delay: 0 },
  { x: "46%", y: "4%", w: 200, rx: -12, ry: 30, rz: 14, depth: 0.6, delay: 0.6 },
  { x: "38%", y: "52%", w: 250, rx: 26, ry: 16, rz: 6, depth: 0.85, delay: 1.2 },
  { x: "0%", y: "62%", w: 160, rx: -20, ry: -30, rz: -18, depth: 0.45, delay: 1.8 },
];

export function Hero({ ready }: { ready: boolean }) {
  const { d } = useI18n();
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const fade = useTransform(scrollY, [0, 520], [1, 0]);
  const lift = useTransform(scrollY, [0, 520], [0, -80]);

  // Parallax con el puntero (solo en dispositivos con mouse)
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 18 });
  const sy = useSpring(py, { stiffness: 60, damping: 18 });
  useEffect(() => {
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      px.set(e.clientX / window.innerWidth - 0.5);
      py.set(e.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [px, py, reduce]);

  const lines = [d.hero.titleA, d.hero.titleB, d.hero.titleC];

  return (
    <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden pb-24 pt-28">
      <HeroBackdrop />

      <motion.div style={{ opacity: fade, y: lift }} className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-4 sm:px-8 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={ready ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.6, ease: EASE }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky/30 bg-white/70 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-sky-deep backdrop-blur"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-sky" />
            {d.hero.eyebrow}
          </motion.p>

          <h1 className="font-display text-[clamp(3rem,10.5vw,4.6rem)] font-extrabold leading-[0.9] tracking-[-0.045em] text-ink sm:text-[clamp(4.2rem,6.4vw,7.2rem)]">
            {lines.map((line, i) => (
              <span key={i} className="block overflow-hidden pb-[0.06em] lg:whitespace-nowrap">
                <motion.span
                  className={`block ${i === 2 ? "text-sky" : ""}`}
                  initial={{ y: "105%" }}
                  animate={ready ? { y: "0%" } : undefined}
                  transition={{ duration: 0.9, ease: EASE, delay: 0.08 + i * 0.1 }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={ready ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.7, ease: EASE, delay: 0.45 }}
            className="mt-8 max-w-xl text-lg leading-relaxed text-ink-soft sm:text-xl"
          >
            {d.hero.lead}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={ready ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.7, ease: EASE, delay: 0.55 }}
            className="mt-10 flex flex-wrap gap-3"
          >
            <a href="#productos" className="btn btn-primary h-14 px-7 text-base">
              {d.hero.ctaPrimary}
            </a>
            <a href="#distribucion" className="btn btn-ghost h-14 px-7 text-base backdrop-blur">
              {d.hero.ctaSecondary}
            </a>
          </motion.div>
        </div>

        {/* Constelación de hojas en 3D */}
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-25 lg:pointer-events-auto lg:relative lg:inset-auto lg:z-0 lg:h-[560px] lg:opacity-100" style={{ perspective: 1200 }}>
          {FLOATERS.map((f, i) => (
            <Floater key={i} f={f} index={i} ready={ready} sx={sx} sy={sy} reduce={!!reduce} />
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : undefined}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.3em] text-ink-faint"
      >
        {d.hero.scroll}
        <span className="relative h-10 w-px overflow-hidden bg-line">
          <motion.span
            className="absolute inset-x-0 top-0 h-1/2 bg-sky"
            animate={reduce ? undefined : { y: ["-100%", "200%"] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      </motion.div>
    </section>
  );
}

type Spring = ReturnType<typeof useSpring>;

function Floater({
  f,
  index,
  ready,
  sx,
  sy,
  reduce,
}: {
  f: (typeof FLOATERS)[number];
  index: number;
  ready: boolean;
  sx: Spring;
  sy: Spring;
  reduce: boolean;
}) {
  const tx = useTransform(sx, (v) => v * 60 * f.depth);
  const ty = useTransform(sy, (v) => v * 40 * f.depth);
  const ry = useTransform(sx, (v) => f.ry + v * 18);
  const rx = useTransform(sy, (v) => f.rx - v * 14);

  return (
    <motion.div className="absolute" style={{ left: f.x, top: f.y, x: tx, y: ty, transformStyle: "preserve-3d" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.6, z: -200 }}
        animate={ready ? { opacity: 1, scale: 1, z: 0 } : undefined}
        transition={{ duration: 1.1, ease: EASE, delay: 0.25 + index * 0.12 }}
      >
        <motion.div
          style={{ rotateX: rx, rotateY: ry, rotateZ: f.rz, width: `min(${f.w}px, ${Math.round(f.w / 4.2)}vw)` }}
          animate={reduce ? undefined : { y: [0, -18, 0] }}
          transition={{ duration: 6 + index, repeat: Infinity, ease: "easeInOut", delay: f.delay }}
        >
          <SheetCard className="w-full text-[clamp(9px,1.1vw,15px)]" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function HeroBackdrop() {
  return (
    <div aria-hidden className="absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_80%_20%,rgba(0,191,255,0.18),transparent_70%),radial-gradient(60%_50%_at_10%_90%,rgba(10,63,191,0.10),transparent_70%)]" />
      <div className="absolute -right-[10%] top-[8%] h-[42vmax] w-[42vmax] rounded-full bg-sky/20 blur-[90px] [animation:drift_14s_ease-in-out_infinite]" />
      <div className="absolute -left-[12%] bottom-[-10%] h-[36vmax] w-[36vmax] rounded-full bg-abyss/10 blur-[100px] [animation:drift_18s_ease-in-out_infinite_reverse]" />
      {/* Retícula técnica que se desvanece */}
      <div className="absolute inset-0 [background-image:linear-gradient(rgba(11,27,43,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(11,27,43,0.045)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(ellipse_at_60%_40%,#000_10%,transparent_70%)]" />
      {/* Destello vertical: eco de la línea de luz de la intro */}
      <div className="absolute left-[62%] top-0 hidden h-full w-px bg-gradient-to-b from-transparent via-sky/50 to-transparent lg:block" />
    </div>
  );
}
