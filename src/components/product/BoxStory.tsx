"use client";

/**
 * "La caja": historia guiada por el scroll (sticky, 7 capítulos).
 * Entra girando → muestra sus caras → se abre la pestaña → salen las hojas en abanico →
 * una hoja se corta en la marca → las mitades caen al agua y se disuelven → vuelve la caja y cambia a Floral.
 */
import { motion, useMotionValue, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { SheetCard } from "@/components/landing/SheetCard";
import { WaterTitle } from "@/components/fx/WaterTitle";
import { Box3D, SCENTS } from "./Box3D";
import { Sparkle } from "./Sparkle";
import { useBoxWidth } from "./useBoxWidth";

/** Límites de cada capítulo en el progreso de scroll. */
const CH = [0, 0.1, 0.26, 0.38, 0.52, 0.7, 0.84, 1];

export function BoxStory() {
  const { d } = useI18n();
  const ref = useRef<HTMLElement>(null);
  const W = useBoxWidth({ vw: 0.42, vh: 0.3, max: 300 });
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [chapter, setChapter] = useState(0);
  useMotionValueEvent(p, "change", (v) => {
    const i = CH.findIndex((c, k) => v >= c && v < (CH[k + 1] ?? 2));
    setChapter(Math.max(0, Math.min(6, i)));
  });

  // Caja
  const ry = useTransform(p, [0, 0.1, 0.26, 0.38, 0.84, 0.97], [-250, -22, 338, 335, 335, 700]);
  const rx = useTransform(p, [0, 0.1, 0.26, 0.34, 0.52, 0.84, 0.95], [24, -8, -8, -24, -18, -18, -8]);
  const open = useTransform(p, [0.28, 0.36, 0.8, 0.88], [0, 1, 1, 0]);
  const lift = useTransform(p, [0.39, 0.5, 0.7, 0.8], [0, 1, 1, 0]);
  const none = useMotionValue(0);
  const all = useMotionValue(1);
  const boxX = useTransform(p, [0.86, 0.95], ["0%", "-58%"]);
  // Segunda caja (Floral) que entra para el capítulo de aromas
  const fRy = useTransform(p, [0.86, 0.97], [200, 380]);
  const fRx = useTransform(p, [0.86, 0.97], [-30, -8]);
  const fX = useTransform(p, [0.86, 0.95], ["140%", "58%"]);
  const fOpacity = useTransform(p, [0.86, 0.92], [0, 1]);
  const floral = useTransform(p, [0.88, 0.96], [0, 1]);
  const boxScale = useTransform(p, [0, 0.1, 0.52, 0.58, 0.82, 0.9], [0.25, 1, 1, 0.62, 0.62, 1]);
  const boxY = useTransform(p, [0.52, 0.58, 0.82, 0.9], ["0%", "-38%", "-38%", "0%"]);
  const boxOpacity = useTransform(p, [0, 0.05, 0.52, 0.58, 0.82, 0.9], [0, 1, 1, 0.35, 0.35, 1]);
  const boxBlur = useTransform(p, [0.52, 0.58, 0.82, 0.9], ["blur(0px)", "blur(3px)", "blur(3px)", "blur(0px)"]);


  return (
    <section ref={ref} id="la-caja" className="relative h-[720vh] rounded-t-[2.5rem] bg-[#140a1f] text-white">
      <div className="sticky top-0 h-[100svh] overflow-hidden rounded-t-[2.5rem]">
        {/* Ambiente */}
        <div className="absolute inset-0" style={{ background: `radial-gradient(60% 55% at 62% 52%, ${SCENTS.original.glow}55 0%, #b04a8a33 38%, transparent 70%)` }} />
        <motion.div className="absolute inset-0" style={{ opacity: floral, background: `radial-gradient(45% 50% at 80% 55%, ${SCENTS.floral.glow}66 0%, #5a6bd833 40%, transparent 70%)` }} />
        <Twinkles />

        {/* Escenario */}
        <div className="absolute inset-0 flex items-center justify-center pt-[22svh] lg:pl-[30vw] lg:pt-[8svh]" style={{ perspective: 1500 }}>
          <motion.div style={{ scale: boxScale, x: boxX, y: boxY, opacity: boxOpacity, filter: boxBlur }}>
            <Box3D width={W} rx={rx} ry={ry} open={open} lift={lift} floral={none} />
            <div className="mx-auto -mt-2 h-6 w-[80%] rounded-[50%] bg-black/50 blur-xl" />
          </motion.div>
          <motion.div className="absolute" style={{ x: fX, opacity: fOpacity }}>
            <Box3D width={W} rx={fRx} ry={fRy} open={none} lift={none} floral={all} simple="floral" />
            <div className="mx-auto -mt-2 h-6 w-[80%] rounded-[50%] bg-black/50 blur-xl" />
          </motion.div>
        </div>

        <TearScene p={p} W={W} />
        <Water p={p} />

        {/* Capítulos */}
        <div className="pointer-events-none absolute inset-x-0 top-[13svh] px-6 text-center lg:inset-y-0 lg:left-[7vw] lg:right-auto lg:top-0 lg:flex lg:w-[36vw] lg:items-center lg:px-0 lg:text-left">
          <motion.div key={chapter} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.32em] text-white/55">
              {String(chapter + 1).padStart(2, "0")} / 07 · {d.story.kicker}
            </p>
            <WaterTitle play lines={[d.story.chapters[chapter].title]} className="mt-3 font-display text-[clamp(2rem,9vw,4.6rem)] font-extrabold leading-[0.95] tracking-[-0.035em] lg:text-[clamp(2rem,5.4vw,4.6rem)]" />
            <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-white/70 sm:text-lg lg:mx-0">{d.story.chapters[chapter].text}</p>
          </motion.div>
        </div>

        {/* Progreso */}
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-1.5 lg:left-[7vw] lg:translate-x-0">
          {CH.slice(0, 7).map((_, i) => (
            <span key={i} className={`h-1 rounded-full transition-all duration-500 ${i === chapter ? "w-8 bg-white" : "w-3 bg-white/25"}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Una hoja vuela al frente, la luz recorre la marca y se parte en dos. */
function TearScene({ p, W }: { p: MotionValue<number>; W: number }) {
  const show = useTransform(p, [0.52, 0.56, 0.78, 0.8], [0, 1, 1, 0]);
  const y = useTransform(p, [0.52, 0.58], ["-60vh", "0vh"]);
  const rot = useTransform(p, [0.52, 0.58], [-28, -4]);
  const beam = useTransform(p, [0.59, 0.63], [0, 1]);
  const beamOut = useTransform(p, [0.63, 0.65], [1, 0]);
  const split = useTransform(p, [0.64, 0.7], [0, 1]);
  const fall = useTransform(p, [0.71, 0.79], [0, 1]);
  const lx = useTransform([split, fall], ([s, f]: number[]) => `translate(${-s * 30}%, ${f * 60}vh) rotate(${-s * 12 - f * 30}deg) scale(${1 - f * 0.45})`);
  const rxf = useTransform([split, fall], ([s, f]: number[]) => `translate(${s * 30}%, ${f * 64}vh) rotate(${s * 12 + f * 34}deg) scale(${1 - f * 0.45})`);
  const melt = useTransform(p, [0.73, 0.79], ["blur(0px)", "blur(14px)"]);
  const sparkle = useTransform(p, [0.63, 0.65, 0.7], [0, 1, 0]);
  const width = Math.min(W * 1.5, 420);

  return (
    <motion.div className="pointer-events-none absolute inset-0 flex items-center justify-center pt-[22svh] lg:pl-[30vw] lg:pt-0" style={{ opacity: show }}>
      <motion.div className="relative" style={{ width, aspectRatio: "3 / 2", y, rotate: rot, filter: "drop-shadow(0 40px 50px rgba(0,0,0,0.45))" }}>
        <motion.div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden rounded-l-[12px]" style={{ transform: lx, transformOrigin: "100% 50%", filter: melt }}>
          <SheetCard className="h-full !w-[200%]" />
        </motion.div>
        <motion.div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden rounded-r-[12px]" style={{ transform: rxf, transformOrigin: "0% 50%", filter: melt }}>
          <SheetCard className="h-full !w-[200%] -translate-x-1/2" />
        </motion.div>
        <motion.div
          className="absolute -inset-y-[14%] left-1/2 w-[3px] -translate-x-1/2 rounded-full bg-white"
          style={{ scaleY: beam, opacity: beamOut, originY: 0, boxShadow: "0 0 8px 2px #fff, 0 0 26px 8px #00BFFF, 0 0 70px 18px rgba(0,191,255,0.6)" }}
        />
        <motion.div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ opacity: sparkle, scale: sparkle }}>
          {[[-70, -50, 22], [60, -70, 16], [-40, 70, 14], [80, 40, 26], [0, -90, 12]].map(([x, yy, s], i) => (
            <Sparkle key={i} size={s} className="absolute text-white" style={{ left: x, top: yy }} />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/** Agua que sube; las mitades caen dentro y se deshacen en burbujas. */
function Water({ p }: { p: MotionValue<number> }) {
  const h = useTransform(p, [0.68, 0.74, 0.82, 0.88], ["0%", "34%", "34%", "0%"]);
  const visible = useTransform(p, [0.675, 0.685, 0.875, 0.885], [0, 1, 1, 0]);
  const bubbles = useTransform(p, [0.74, 0.77, 0.84], [0, 1, 0]);
  return (
    <motion.div className="pointer-events-none absolute inset-x-0 bottom-0 z-10" style={{ height: h, opacity: visible }}>
      <svg className="absolute -top-[22px] left-0 h-6 w-[200%] animate-[wave_6s_linear_infinite]" viewBox="0 0 1200 24" preserveAspectRatio="none" aria-hidden>
        <path d="M0 12 Q75 0 150 12 T300 12 T450 12 T600 12 T750 12 T900 12 T1050 12 T1200 12 V24 H0 Z" fill="rgba(120,200,255,0.55)" />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(120,200,255,0.55)] to-[rgba(10,63,191,0.85)] backdrop-blur-[2px]" />
      <motion.div className="absolute inset-0" style={{ opacity: bubbles }}>
        {Array.from({ length: 22 }, (_, i) => (
          <span
            key={i}
            className="absolute bottom-0 rounded-full border border-white/70 bg-white/20"
            style={{
              left: `${30 + ((i * 37) % 40)}%`,
              width: 6 + ((i * 7) % 14),
              height: 6 + ((i * 7) % 14),
              animation: `bubble ${2.2 + (i % 5) * 0.5}s ease-in ${(i % 7) * 0.3}s infinite`,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

/** Destellos de cuatro puntas como los de la caja. */
function Twinkles() {
  const spots = [[12, 18, 14], [84, 14, 10], [72, 70, 18], [22, 78, 10], [50, 10, 8], [92, 52, 12], [6, 50, 8]];
  return (
    <>
      {spots.map(([x, y, s], i) => (
        <Sparkle key={i} size={s} className="absolute text-white/70" style={{ left: `${x}%`, top: `${y}%`, animation: `twinkle ${2.4 + i * 0.4}s ease-in-out ${i * 0.3}s infinite` }} />
      ))}
    </>
  );
}
