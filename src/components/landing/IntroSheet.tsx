"use client";

/**
 * Animación de apertura de Snap Slide.
 *
 *  1. Una línea vertical de luz blanca nace en el centro del degradado celeste → azul.
 *  2. La línea implosiona en un punto de luz (un anillo se contrae hacia el centro).
 *  3. Del punto emerge la hoja de detergente: rectángulo blanco con la marca de corte al medio.
 *  4. Un haz de luz recorre la marca y la hoja se corta en dos mitades.
 *  5. Desde el corte explota la luz, inunda la pantalla de blanco y aparece el logo.
 *  6. El overlay se retira y queda la home (fondo blanco, transición sin costura).
 *
 * Se muestra una vez por sesión, se puede saltar (botón o Esc) y respeta reduced motion.
 */
import { useAnimate, useReducedMotion, type AnimationSequence } from "framer-motion";
import { useCallback, useEffect, useRef } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { Logo } from "@/components/brand/Logo";

export const INTRO_SEEN_KEY = "snapslide-intro-seen";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
const EASE_IN: [number, number, number, number] = [0.7, 0, 0.84, 0];
const EASE_IN_OUT: [number, number, number, number] = [0.65, 0, 0.35, 1];

export function IntroSheet({ onDone }: { onDone: () => void }) {
  const { d } = useI18n();
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reduceMotion = useReducedMotion();
  const finished = useRef(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      /* sin almacenamiento: se repetirá en la próxima carga */
    }
    onDone();
  }, [onDone]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && finish();
    window.addEventListener("keydown", onKey);

    let cancelled = false;
    const run = async () => {
      if (reduceMotion) {
        await animate("[data-flood]", { opacity: 1 }, { duration: 0 });
        await animate("[data-logo]", { opacity: [0, 1] }, { duration: 0.4 });
        await animate("[data-logo]", { opacity: 1 }, { duration: 0.6 });
        return;
      }

      // Tiempos absolutos (segundos) para controlar con precisión cada golpe de la secuencia.
      const sequence: AnimationSequence = [
        // 1 · Nace la línea de luz
        ["[data-line]", { scaleY: [0, 1], opacity: [0, 1] }, { duration: 0.75, ease: EASE_OUT, at: 0 }],
        // 2 · Implosión: la línea se comprime y un anillo se cierra hacia el centro
        ["[data-line]", { scaleY: 0, scaleX: 2.5, opacity: [1, 1, 0] }, { duration: 0.32, ease: EASE_IN, at: 0.9 }],
        ["[data-ring]", { scale: [3.2, 0], opacity: [0, 0.9, 0] }, { duration: 0.45, ease: EASE_IN, at: 0.9 }],
        ["[data-core]", { scale: [0, 1.8, 0.8], opacity: [0, 1, 1] }, { duration: 0.42, ease: EASE_OUT, at: 1.15 }],
        // 3 · Emerge la hoja
        ["[data-sheet]", { scale: [0.06, 1], opacity: [0, 1], rotate: [-8, 0] }, { duration: 0.85, ease: EASE_OUT, at: 1.35 }],
        ["[data-core]", { opacity: 0, scale: 0 }, { duration: 0.25, at: 1.5 }],
        ["[data-hint]", { opacity: [0, 1], y: [6, 0] }, { duration: 0.35, ease: EASE_OUT, at: 2.0 }],
        // 4 · El haz de luz recorre la marca
        ["[data-cut]", { scaleY: [0, 1] }, { duration: 0.55, ease: EASE_IN_OUT, at: 2.55 }],
        ["[data-hint]", { opacity: 0 }, { duration: 0.2, at: 2.95 }],
        ["[data-mark]", { opacity: 0 }, { duration: 0.2, at: 3.0 }],
        // 5 · Corte: las mitades se separan y la luz florece desde el corte
        ["[data-half='l']", { x: "-46%", rotate: -14, opacity: [1, 1, 0] }, { duration: 0.9, ease: EASE_OUT, at: 3.1 }],
        ["[data-half='r']", { x: "46%", rotate: 14, opacity: [1, 1, 0] }, { duration: 0.9, ease: EASE_OUT, at: 3.1 }],
        ["[data-cut]", { scaleX: [1, 6], opacity: [1, 0] }, { duration: 0.3, at: 3.1 }],
        ["[data-burst]", { scale: [0, 30] }, { duration: 1.1, ease: [0.55, 0, 0.25, 1], at: 3.3 }],
        ["[data-rays]", { scale: [0.2, 2.4], opacity: [0, 1, 0], rotate: [0, 30] }, { duration: 1, ease: EASE_OUT, at: 3.3 }],
        // 6 · Aparece el logo y se sostiene
        ["[data-logo]", { scale: [0.72, 1], opacity: [0, 1], filter: ["blur(16px)", "blur(0px)"] }, { duration: 0.9, ease: EASE_OUT, at: 3.75 }],
        ["[data-logo]", { scale: 1.02 }, { duration: 0.75, ease: "linear", at: 4.65 }],
      ];
      await animate(sequence);
    };

    run().then(() => {
      if (!cancelled) finish();
    });

    return () => {
      cancelled = true;
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [animate, finish, reduceMotion]);

  return (
    <div
      ref={scope}
      role="dialog"
      aria-label="Snap Slide"
      className="fixed inset-0 z-[100] overflow-hidden"
      style={{ background: "radial-gradient(120% 90% at 50% 40%, #00BFFF 0%, #0A7FE0 45%, #0A3FBF 100%)" }}
    >
      {/* Grano sutil para que el degradado no se vea plano */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:3px_3px]" />

      <div className="absolute inset-0 grid place-items-center">
        {/* 1 · Línea de luz */}
        <div
          data-line
          className="absolute h-[64vh] w-[2px] origin-center rounded-full bg-white opacity-0"
          style={{ boxShadow: "0 0 12px 2px #fff, 0 0 40px 8px rgba(255,255,255,0.55), 0 0 90px 20px rgba(0,191,255,0.6)" }}
        />
        {/* 2 · Anillo de implosión y núcleo */}
        <div data-ring className="absolute h-40 w-40 rounded-full border-2 border-white/80 opacity-0" style={{ boxShadow: "0 0 30px rgba(255,255,255,0.7)" }} />
        <div data-core className="absolute h-5 w-5 rounded-full bg-white opacity-0" style={{ boxShadow: "0 0 20px 6px #fff, 0 0 60px 20px rgba(0,191,255,0.8)" }} />

        {/* 3 · La hoja */}
        <div
          data-sheet
          className="relative opacity-0"
          style={{ width: "min(72vw, 420px)", aspectRatio: "3 / 2", filter: "drop-shadow(0 30px 40px rgba(4,30,90,0.45))" }}
        >
          <SheetHalf side="l" />
          <SheetHalf side="r" />

          {/* Marca de corte */}
          <div data-mark className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2">
            <div className="absolute inset-y-[6%] left-1/2 w-0 -translate-x-1/2 border-l-2 border-dashed border-sky/50" />
            <div className="absolute -top-px left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[3px] bg-sky" />
            <div className="absolute -bottom-px left-1/2 h-3 w-3 -translate-x-1/2 translate-y-1/2 rotate-45 rounded-[3px] bg-sky" />
          </div>

          {/* 4 · Haz de corte */}
          <div
            data-cut
            className="pointer-events-none absolute -inset-y-[14%] left-1/2 w-[3px] -translate-x-1/2 origin-top rounded-full bg-white"
            style={{ transform: "scaleY(0)", boxShadow: "0 0 8px 2px #fff, 0 0 24px 6px #00BFFF, 0 0 60px 14px rgba(0,191,255,0.7)" }}
          />

          <p
            data-hint
            className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-[0.7rem] font-bold uppercase tracking-[0.3em] text-white/85 opacity-0"
          >
            ✂ {d.showcase.cutHint}
          </p>
        </div>

        {/* 5 · Explosión de luz */}
        <div
          data-rays
          className="pointer-events-none absolute h-[60vmax] w-[60vmax] opacity-0"
          style={{
            background:
              "repeating-conic-gradient(from 0deg, rgba(255,255,255,0.55) 0deg 2deg, transparent 2deg 15deg)",
            maskImage: "radial-gradient(circle, #000 0%, transparent 65%)",
            WebkitMaskImage: "radial-gradient(circle, #000 0%, transparent 65%)",
          }}
        />
        <div data-burst className="pointer-events-none absolute h-[10vmax] w-[10vmax] rounded-full"
          style={{ transform: "scale(0)", background: "radial-gradient(circle, #fff 0%, #fff 52%, rgba(255,255,255,0.6) 62%, rgba(255,255,255,0) 72%)" }}
        />
        <div data-flood className="pointer-events-none absolute inset-0 bg-white opacity-0" />

        {/* 6 · Logo */}
        <div data-logo className="absolute opacity-0">
          <Logo className="scale-[1.9] sm:scale-[2.6]" />
        </div>
      </div>

      <button
        onClick={finish}
        className="absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-6 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white/80 ring-1 ring-white/40 backdrop-blur transition-colors hover:bg-white/15 hover:text-white"
      >
        {d.common.skipIntro}
      </button>
    </div>
  );
}

function SheetHalf({ side }: { side: "l" | "r" }) {
  const left = side === "l";
  return (
    <div
      data-half={side}
      className={`absolute inset-y-0 w-1/2 bg-white ${left ? "left-0 rounded-l-[14px]" : "right-0 rounded-r-[14px]"}`}
      style={{
        transformOrigin: left ? "100% 50%" : "0% 50%",
        // Un solo degradado continuo a lo ancho de la hoja: las dos mitades se leen como una pieza.
        backgroundImage: "linear-gradient(160deg, #ffffff 0%, #f3fbff 60%, #e8f6fe 100%)",
        backgroundSize: "200% 100%",
        backgroundPosition: left ? "0% 0%" : "100% 0%",
      }}
    >
      {/* Relieve sutil de la marca en cada mitad */}
      <span
        className={`absolute top-1/2 -translate-y-1/2 font-display text-[clamp(0.9rem,3.4vw,1.4rem)] font-extrabold tracking-[0.2em] text-sky/25 ${
          left ? "right-[14%]" : "left-[14%]"
        }`}
      >
        {left ? "SNAP" : "SLIDE"}
      </span>
      {/* Textura de fibra */}
      <span className="absolute inset-0 rounded-[inherit] opacity-40 [background-image:repeating-linear-gradient(90deg,transparent_0_7px,rgba(0,191,255,0.05)_7px_8px)]" />
    </div>
  );
}
