"use client";

/**
 * Home: agua celeste, las dos cajas reales flotando sobre ondas y pétalos alrededor.
 * Mobile first: en móvil todo va centrado y apilado; desde `lg` texto a la izquierda y cajas a la derecha.
 */
import { motion, useAnimationFrame, useInView, useMotionValue, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { PetalCluster } from "@/components/fx/Petals";
import { WaterTitle } from "@/components/fx/WaterTitle";
import { Box3D } from "@/components/product/Box3D";
import { useBoxWidth } from "@/components/product/useBoxWidth";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function Hero({ ready }: { ready: boolean }) {
  const { d } = useI18n();
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const fade = useTransform(scrollY, [0, 560], [1, 0]);
  const lift = useTransform(scrollY, [0, 560], [0, -70]);

  return (
    <section className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#f7fcff_0%,#e7f6ff_55%,#cdeeff_100%)] pb-28 pt-28 sm:pt-32 lg:flex lg:min-h-[100svh] lg:items-center lg:pb-32">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute -right-[20%] top-[4%] h-[60vmax] w-[60vmax] rounded-full bg-sky/20 blur-[100px] [animation:drift_14s_ease-in-out_infinite] lg:-right-[8%] lg:h-[44vmax] lg:w-[44vmax]" />
        <div className="absolute -left-[18%] bottom-[-14%] h-[44vmax] w-[44vmax] rounded-full bg-white blur-[90px] [animation:drift_18s_ease-in-out_infinite_reverse]" />
      </div>

      <motion.div style={reduce ? undefined : { opacity: fade, y: lift }} className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-6 px-5 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
        <div className="text-center lg:text-left">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={ready ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.6, ease: EASE }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky/30 bg-white/70 px-3 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-sky-deep backdrop-blur sm:text-xs"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-sky" />
            {d.hero.eyebrow}
          </motion.p>

          <div className="relative">
            <WaterTitle
              as="h1"
              play={ready}
              delay={0.1}
              lines={[d.hero.titleA, d.hero.titleB, d.hero.titleC]}
              lineClassName={(i) => (i === 2 ? "text-sky" : "")}
              className="font-display text-[clamp(2.6rem,12.5vw,4.6rem)] font-extrabold leading-[0.92] tracking-[-0.045em] text-ink sm:text-[clamp(4rem,8vw,6rem)] lg:text-[clamp(4.2rem,6vw,6.6rem)]"
            />
            <PetalCluster className="-top-10 right-0 sm:right-[8%] lg:-right-4 lg:-top-12" />
          </div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={ready ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.7, ease: EASE, delay: 0.7 }}
            className="mx-auto mt-6 max-w-md text-base leading-relaxed text-ink-soft sm:mt-8 sm:max-w-xl sm:text-lg lg:mx-0 lg:text-xl"
          >
            {d.hero.lead}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={ready ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.7, ease: EASE, delay: 0.85 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start"
          >
            <a href="#la-caja" className="btn btn-primary h-14 w-full px-7 text-base sm:w-auto">
              {d.hero.ctaPrimary}
            </a>
            <a href="#distribucion" className="btn btn-ghost h-14 w-full px-7 text-base backdrop-blur sm:w-auto">
              {d.hero.ctaSecondary}
            </a>
          </motion.div>
        </div>

        <HeroBoxes ready={ready} reduce={!!reduce} />
      </motion.div>

      {/* Superficie del agua hacia la siguiente sección */}
      <svg aria-hidden viewBox="0 0 1440 90" preserveAspectRatio="none" className="absolute inset-x-0 bottom-[-1px] h-14 w-full sm:h-20">
        <path d="M0 50 C180 20 360 20 540 46 C720 72 900 76 1080 50 C1260 24 1350 28 1440 40 V90 H0 Z" fill="#ffffff" />
      </svg>
    </section>
  );
}

/** Las dos cajas flotando sobre el agua, con ondas debajo y leve parallax del puntero. */
function HeroBoxes({ ready, reduce }: { ready: boolean; reduce: boolean }) {
  const W = useBoxWidth({ vw: 0.36, vh: 0.3, max: 230 });
  const zero = useMotionValue(0);
  const one = useMotionValue(1);
  const ryF = useMotionValue(-20);
  const ryO = useMotionValue(18);
  const rx = useMotionValue(-8);
  const pointer = useRef({ x: 0, y: 0 });
  const stage = useRef<HTMLDivElement>(null);
  // El bucle de animación solo corre mientras las cajas están en pantalla.
  const visible = useInView(stage);

  useEffect(() => {
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      pointer.current = { x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 };
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduce]);

  useAnimationFrame((t) => {
    if (reduce || !visible) return;
    const { x, y } = pointer.current;
    ryF.set(-20 + Math.sin(t / 2400) * 9 + x * 24);
    ryO.set(18 + Math.sin(t / 2700 + 1.4) * 8 + x * 24);
    rx.set(-8 + Math.cos(t / 3000) * 3 - y * 14);
  });

  return (
    <motion.div
      ref={stage}
      initial={{ opacity: 0, y: 40, scale: 0.92 }}
      animate={ready ? { opacity: 1, y: 0, scale: 1 } : undefined}
      transition={{ duration: 1.2, ease: EASE, delay: 0.35 }}
      className="relative mx-auto flex h-[clamp(300px,88vw,440px)] w-full max-w-[560px] items-center justify-center lg:h-[600px]"
      style={{ perspective: 1300 }}
    >
      {/* Ondas */}
      <div aria-hidden className="absolute bottom-[6%] left-1/2 h-[22%] w-[110%] -translate-x-1/2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute inset-0 rounded-[50%] border-2 border-sky/40"
            style={{ animation: reduce ? undefined : `ripple 4.5s ease-out ${i * 1.5}s infinite` }}
          />
        ))}
        <span className="absolute inset-[22%] rounded-[50%] bg-sky/20 blur-xl" />
      </div>

      {/* Original detrás, Floral delante */}
      <motion.div className="absolute left-[8%] top-[10%] sm:left-[12%]" animate={reduce ? undefined : { y: [0, -12, 0] }} transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}>
        <div className="opacity-95 [filter:saturate(0.95)]">
          <Box3D width={Math.round(W * 0.82)} rx={rx} ry={ryO} open={zero} lift={zero} floral={zero} simple="original" />
        </div>
      </motion.div>
      <motion.div className="absolute right-[6%] top-[22%] sm:right-[12%]" animate={reduce ? undefined : { y: [0, -16, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}>
        <Box3D width={W} rx={rx} ry={ryF} open={zero} lift={zero} floral={one} simple="floral" />
        <div className="mx-auto mt-3 h-4 w-[70%] rounded-[50%] bg-abyss/25 blur-lg" />
      </motion.div>

      <PetalCluster className="left-[2%] top-[0%]" scale={1.2} />
      <PetalCluster className="bottom-[16%] right-[0%]" scale={0.9} />
    </motion.div>
  );
}
