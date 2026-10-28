"use client";

/**
 * Showcase con scroll fijado (sticky): el recorrido de scroll arma la escena.
 * Acto 1 (0 → 0.5): las hojas vuelan, se apilan y la superior se corta en la marca.
 * Acto 2 (0.5 → 1): entra la botella de líquido y se llena.
 */
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { SheetCard } from "./SheetCard";

const SCATTER = [
  { x: -260, y: -180, r: -38 },
  { x: 240, y: -220, r: 30 },
  { x: -300, y: 120, r: 22 },
  { x: 280, y: 160, r: -26 },
  { x: 0, y: -320, r: 50 },
  { x: 40, y: 300, r: -44 },
];

export function ProductShowcase() {
  const { d } = useI18n();
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [act, setAct] = useState<0 | 1>(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setAct(v < 0.5 ? 0 : 1));

  const sheetsOut = useTransform(scrollYProgress, [0.46, 0.56], [1, 0]);
  const sheetsScale = useTransform(scrollYProgress, [0.46, 0.56], [1, 0.8]);

  const content = act === 0
    ? { title: d.showcase.sheetTitle, lead: d.showcase.sheetLead, points: d.showcase.sheetPoints }
    : { title: d.showcase.liquidTitle, lead: d.showcase.liquidLead, points: d.showcase.liquidPoints };

  return (
    <section id="productos" ref={ref} className="relative h-[340vh] scroll-mt-0 bg-gradient-to-b from-white via-mist to-white">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-6 px-4 pt-20 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:pt-0">
          {/* Texto */}
          <div className="relative z-10 order-2 lg:order-1">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-sky-deep">{d.showcase.kicker}</p>
            <div className="mt-5 flex items-center gap-3 text-xs font-bold text-ink-faint">
              {[d.showcase.sheetTitle, d.showcase.liquidTitle].map((label, i) => (
                <span key={label} className={`flex items-center gap-2 transition-colors ${act === i ? "text-ink" : ""}`}>
                  <span className={`grid h-6 w-6 place-items-center rounded-full text-[0.65rem] transition-colors ${act === i ? "bg-sky text-white" : "bg-line"}`}>
                    0{i + 1}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </span>
              ))}
            </div>

            <motion.div key={act} initial={{ opacity: 0, y: 18, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
              <h2 className="mt-6 font-display text-[clamp(2.2rem,5vw,4.4rem)] font-extrabold leading-[0.95] tracking-[-0.035em] text-ink">{content.title}</h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft sm:text-lg">{content.lead}</p>
              <ul className="mt-7 grid max-w-md grid-cols-2 gap-2">
                {content.points.map((pt) => (
                  <li key={pt} className="flex items-start gap-2 rounded-2xl border border-line bg-white/80 px-3 py-3 text-sm font-semibold text-ink">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky" />
                    {pt}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Escenario */}
          <div className="relative order-1 h-[42svh] lg:order-2 lg:h-[640px]">
            <div className="absolute inset-0 grid place-items-center">
              <div className="absolute h-[70%] w-[70%] rounded-full bg-sky/15 blur-[80px]" />
            </div>

            <motion.div style={{ opacity: sheetsOut, scale: sheetsScale }} className="absolute inset-0 grid place-items-center">
              <div className="relative w-[min(62vw,360px)] text-[clamp(10px,1.4vw,16px)]" style={{ aspectRatio: "3 / 2" }}>
                {SCATTER.map((s, i) => (
                  <StackSheet key={i} index={i} from={s} progress={scrollYProgress} reduce={!!reduce} />
                ))}
                <CuttingSheet progress={scrollYProgress} hint={d.showcase.cutHint} />
              </div>
            </motion.div>

            <Bottle progress={scrollYProgress} />
          </div>
        </div>
      </div>
    </section>
  );
}

function StackSheet({ index, from, progress, reduce }: { index: number; from: { x: number; y: number; r: number }; progress: MotionValue<number>; reduce: boolean }) {
  const end = 0.08 + index * 0.025;
  const x = useTransform(progress, [0, end], [reduce ? 0 : from.x, 0]);
  const y = useTransform(progress, [0, end], [reduce ? index * 6 : from.y, index * 6]);
  const rotate = useTransform(progress, [0, end], [reduce ? 0 : from.r, (index % 2 ? 1 : -1) * index * 0.8]);
  const opacity = useTransform(progress, [0, end * 0.6], [0, 1]);
  return (
    <motion.div className="absolute inset-0" style={{ x, y, rotate, opacity, zIndex: 10 - index }}>
      <SheetCard className="h-full w-full" showBrand={index === 0} showMarks={index === 0} />
    </motion.div>
  );
}

/** La hoja superior: se eleva, un haz recorre la marca y se separa en dos mitades. */
function CuttingSheet({ progress, hint }: { progress: MotionValue<number>; hint: string }) {
  const visible = useTransform(progress, [0.24, 0.26], [0, 1]);
  const lift = useTransform(progress, [0.26, 0.32], [0, -40]);
  const beam = useTransform(progress, [0.32, 0.38], [0, 1]);
  const beamOpacity = useTransform(progress, [0.38, 0.41], [1, 0]);
  const hintOpacity = useTransform(progress, [0.27, 0.3, 0.36, 0.38], [0, 1, 1, 0]);
  const split = useTransform(progress, [0.38, 0.46], [0, 1]);
  const lx = useTransform(split, (v) => `${-v * 34}%`);
  const rx = useTransform(split, (v) => `${v * 34}%`);
  const lr = useTransform(split, [0, 1], [0, -9]);
  const rr = useTransform(split, [0, 1], [0, 9]);

  return (
    <motion.div className="absolute inset-0 z-20" style={{ opacity: visible, y: lift }}>
      <motion.div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden" style={{ x: lx, rotate: lr, transformOrigin: "100% 50%" }}>
        <SheetCard className="h-full !w-[200%]" />
      </motion.div>
      <motion.div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden" style={{ x: rx, rotate: rr, transformOrigin: "0% 50%" }}>
        <SheetCard className="h-full !w-[200%] -translate-x-1/2" />
      </motion.div>
      <motion.div
        className="absolute -inset-y-[12%] left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-white"
        style={{ scaleY: beam, opacity: beamOpacity, originY: 0, boxShadow: "0 0 8px 2px #fff, 0 0 22px 6px #00BFFF, 0 0 50px 12px rgba(0,191,255,0.6)" }}
      />
      <motion.span style={{ opacity: hintOpacity }} className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.25em] text-white">
        ✂ {hint}
      </motion.span>
    </motion.div>
  );
}

function Bottle({ progress }: { progress: MotionValue<number> }) {
  const y = useTransform(progress, [0.5, 0.64], [260, 0]);
  const opacity = useTransform(progress, [0.5, 0.58], [0, 1]);
  const rotate = useTransform(progress, [0.5, 0.7, 1], [-14, 4, 0]);
  const fill = useTransform(progress, [0.62, 0.9], [0.08, 0.78]);
  const dropY = useTransform(progress, [0.6, 1], [0, -120]);

  const BODY = "M86 44 H114 V72 C114 82 160 92 160 128 V316 C160 334 146 346 128 346 H72 C54 346 40 334 40 316 V128 C40 92 86 82 86 72 Z";

  return (
    <motion.div style={{ y, opacity }} className="pointer-events-none absolute inset-0 grid place-items-center">
      <motion.svg viewBox="0 0 200 360" style={{ rotate }} className="h-[92%] max-h-[560px] drop-shadow-[0_40px_50px_rgba(10,63,191,0.3)]" aria-hidden>
        <defs>
          <clipPath id="bottle-body">
            <path d={BODY} />
          </clipPath>
          <linearGradient id="bottle-glass" x1="0" x2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="1" stopColor="#e6f6ff" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="bottle-liquid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#00BFFF" />
            <stop offset="1" stopColor="#0A3FBF" />
          </linearGradient>
        </defs>
        <path d={BODY} fill="url(#bottle-glass)" stroke="rgba(0,191,255,0.35)" strokeWidth="1.5" />
        <g clipPath="url(#bottle-body)">
          <motion.rect x="0" y="0" width="200" height="346" fill="url(#bottle-liquid)" style={{ scaleY: fill, originY: 1 }} />
        </g>
        <rect x="78" y="10" width="44" height="38" rx="9" fill="#0B1B2B" />
        <rect x="84" y="16" width="32" height="4" rx="2" fill="#00BFFF" />
        <rect x="56" y="178" width="88" height="104" rx="14" fill="#ffffff" opacity="0.92" />
        <text x="100" y="222" textAnchor="middle" fontFamily="var(--font-sora)" fontWeight="800" fontSize="16" letterSpacing="3" fill="#0B1B2B">SNAP</text>
        <text x="100" y="244" textAnchor="middle" fontFamily="var(--font-sora)" fontWeight="700" fontSize="11" letterSpacing="3.5" fill="#00BFFF">LIQUID</text>
        <rect x="88" y="258" width="24" height="3" rx="1.5" fill="#00BFFF" opacity="0.5" />
        <path d="M52 132 C52 120 62 110 70 106 V300 C60 300 52 292 52 284 Z" fill="#fff" opacity="0.5" />
      </motion.svg>

      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          style={{ y: dropY, left: `${30 + i * 20}%`, top: `${40 + (i % 2) * 18}%` }}
          className="absolute h-3 w-3 rounded-full bg-sky/50 blur-[1px]"
        />
      ))}
    </motion.div>
  );
}
