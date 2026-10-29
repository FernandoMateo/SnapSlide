"use client";

import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { useI18n } from "@/i18n/I18nProvider";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];
/** Tamaño de diseño de la pantalla del iPhone; se escala al ancho real. */
const SCREEN_W = 300;
const SCREEN_H = 650;

/**
 * "Hazte distribuidor en 3 pasos": sección fija mientras se hace scroll.
 * Cada tercio del recorrido activa un paso: cambia el número gigante y la pantalla del iPhone.
 */
export function DistributorSteps() {
  const { d } = useI18n();
  const ref = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => setStep(Math.min(2, Math.max(0, Math.floor(v * 3)))));
  const items = d.steps.items;

  return (
    <section ref={ref} id="distribuidor" aria-labelledby="steps-title" className="relative h-[320svh] text-white" style={{ background: "linear-gradient(180deg, #03101f 0%, #05213f 55%, #03101f 100%)" }}>
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden">
        {/* Luz de agua detrás del teléfono */}
        <div className="pointer-events-none absolute left-1/2 top-[55%] h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00bfff]/25 blur-[90px] lg:left-[68%]" />

        <div className="relative mx-auto grid h-full w-full max-w-7xl grid-rows-[auto_1fr_auto] px-4 pb-6 pt-24 sm:px-8 lg:grid-cols-[1fr_1.05fr] lg:grid-rows-1 lg:items-center lg:gap-10 lg:pb-0 lg:pt-16">
          {/* Texto */}
          <div className="relative z-10 text-center lg:text-left">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.32em] text-[#7fdcff]">{d.steps.kicker}</p>
            <h2 id="steps-title" className="mt-3 font-display text-[clamp(1.9rem,7.5vw,4.4rem)] font-extrabold leading-[0.95] tracking-[-0.04em]">
              {d.steps.title}
            </h2>

            {/* Lista de pasos (escritorio) */}
            <ol className="mt-12 hidden gap-2 lg:grid">
              {items.map((it, i) => {
                const active = i === step;
                return (
                  <li key={it.title} className="relative grid grid-cols-[auto_1fr] gap-x-6 py-4">
                    <span className={`font-display text-6xl font-extrabold leading-none tracking-[-0.06em] transition-colors duration-500 ${active ? "text-[#3fd0ff]" : "text-white/15"}`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="self-center">
                      <span className={`block font-display text-xl font-bold transition-colors duration-500 ${active ? "text-white" : "text-white/35"}`}>{it.title}</span>
                      <motion.span
                        initial={false}
                        animate={{ height: active ? "auto" : 0, opacity: active ? 1 : 0 }}
                        transition={{ duration: 0.5, ease: EASE }}
                        className="block overflow-hidden"
                      >
                        <span className="block max-w-sm pt-2 text-[0.95rem] leading-relaxed text-white/70">{it.text}</span>
                      </motion.span>
                    </span>
                    <span className="absolute inset-x-0 bottom-0 h-px bg-white/10">
                      <motion.span className="block h-full origin-left bg-gradient-to-r from-[#0096d6] to-[#3fd0ff]" initial={false} animate={{ scaleX: i <= step ? 1 : 0 }} transition={{ duration: 0.7, ease: EASE }} />
                    </span>
                  </li>
                );
              })}
            </ol>
            <a href="#distribucion" className="btn btn-primary mt-10 hidden h-13 px-7 text-base lg:inline-flex">
              {d.steps.cta} →
            </a>
          </div>

          {/* Escena: número gigante + iPhone */}
          <div className="relative grid min-h-0 place-items-center">
            <GiantNumber step={step} />
            <Phone step={step} />
          </div>

          {/* Paso activo (móvil) */}
          <div className="relative z-10 text-center lg:hidden">
            <div className="mx-auto flex max-w-[220px] gap-1.5" aria-hidden>
              {items.map((_, i) => (
                <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
                  <motion.span className="block h-full origin-left bg-[#3fd0ff]" initial={false} animate={{ scaleX: i <= step ? 1 : 0 }} transition={{ duration: 0.6, ease: EASE }} />
                </span>
              ))}
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={step} initial={{ opacity: 0, y: 12, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -12, filter: "blur(6px)" }} transition={{ duration: 0.4, ease: EASE }} className="mt-4 min-h-[96px]">
                <p className="font-display text-xl font-bold">
                  <span className="text-[#3fd0ff]">{d.steps.stepLabel} {step + 1} · </span>
                  {items[step].title}
                </p>
                <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-white/70">{items[step].text}</p>
              </motion.div>
            </AnimatePresence>
            <a href="#distribucion" className="btn btn-primary mt-3 h-12 w-full max-w-sm text-sm">
              {d.steps.cta} →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Número del paso a escala de cartel: entra y sale como tinta que se disuelve en agua. */
function GiantNumber({ step }: { step: number }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 grid select-none place-items-center lg:-left-[18%]">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={step}
          initial={{ opacity: 0, y: "18%", filter: "blur(24px)", scale: 0.92 }}
          animate={{ opacity: 1, y: "0%", filter: "blur(0px)", scale: 1 }}
          exit={{ opacity: 0, y: "-14%", filter: "blur(28px)", scale: 1.06 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="col-start-1 row-start-1 font-display text-[clamp(15rem,68vw,38rem)] font-extrabold leading-[0.8] tracking-[-0.08em]"
          style={{
            backgroundImage: "linear-gradient(180deg, rgba(63,208,255,0.55) 0%, rgba(0,150,214,0.18) 55%, rgba(0,150,214,0) 92%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            WebkitTextStroke: "1.5px rgba(127,220,255,0.45)",
          }}
        >
          {String(step + 1).padStart(2, "0")}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function Phone({ step }: { step: number }) {
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / SCREEN_W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <motion.div
      className="relative z-10 [perspective:1400px]"
      animate={reduce ? undefined : { y: [0, -10, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    >
      <motion.div
        initial={false}
        animate={{ rotateY: [-14, 0, 14][step], rotateX: 4 }}
        transition={{ duration: 1, ease: EASE }}
        className="relative aspect-[300/650] h-[min(46svh,420px)] rounded-[13%/6%] p-[3.2%] sm:h-[min(52svh,480px)] lg:h-[min(74svh,640px)]"
        style={{
          background: "linear-gradient(145deg, #3a4a5c 0%, #121b26 40%, #0a1018 60%, #2b3846 100%)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.12) inset, 0 40px 90px -20px rgba(0,0,0,0.75), 0 0 80px -10px rgba(0,191,255,0.35)",
        }}
      >
        {/* Botones laterales */}
        <span className="absolute -left-[1.4%] top-[18%] h-[5%] w-[1.4%] rounded-l bg-[#2b3846]" />
        <span className="absolute -left-[1.4%] top-[26%] h-[9%] w-[1.4%] rounded-l bg-[#2b3846]" />
        <span className="absolute -right-[1.4%] top-[24%] h-[13%] w-[1.4%] rounded-r bg-[#2b3846]" />

        <div ref={frame} className="relative h-full w-full overflow-hidden rounded-[11%/5.2%] bg-[#f4f9fd]">
          {scale > 0 && (
            <div className="absolute left-0 top-0 origin-top-left" style={{ width: SCREEN_W, height: SCREEN_H, transform: `scale(${scale})` }}>
              <Screen step={step} />
            </div>
          )}
          {/* Reflejo del cristal */}
          <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0)_38%)]" />
        </div>
      </motion.div>
    </motion.div>
  );
}

function Screen({ step }: { step: number }) {
  return (
    <div className="relative h-full w-full text-ink">
      {/* Barra de estado + Dynamic Island */}
      <div className="flex h-[50px] items-center justify-between px-7 pt-1 text-[13px] font-bold">
        <span>9:41</span>
        <span className="absolute left-1/2 top-[11px] h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-black" />
        <span className="flex items-center gap-1">
          <svg viewBox="0 0 18 12" className="h-[10px] w-[15px]" aria-hidden><path d="M1 11h2V8H1zm4 0h2V6H5zm4 0h2V3H9zm4 0h2V1h-2z" fill="currentColor" /></svg>
          <span className="h-[10px] w-[20px] rounded-[3px] border border-current p-[1px]"><span className="block h-full w-3/4 rounded-[1px] bg-current" /></span>
        </span>
      </div>

      <div className="flex items-center justify-between px-5 pt-2">
        <Logo className="h-[38px]" />
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`h-[6px] rounded-full transition-all duration-500 ${i === step ? "w-[18px] bg-[#0096d6]" : "w-[6px] bg-[#cfe3f0]"}`} />
          ))}
        </span>
      </div>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.55, ease: EASE }}
          className="absolute inset-x-0 bottom-0 top-[110px] px-5"
        >
          {step === 0 && <ScreenRequest />}
          {step === 1 && <ScreenApproved />}
          {step === 2 && <ScreenSell />}
        </motion.div>
      </AnimatePresence>

      {/* Indicador de inicio */}
      <span className="absolute bottom-[8px] left-1/2 h-[5px] w-[110px] -translate-x-1/2 rounded-full bg-ink/80" />
    </div>
  );
}

const pop = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: EASE, delay: 0.15 + i * 0.12 },
});

function useTyping(text: string, delay = 400) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? text.length : 0);
  useEffect(() => {
    if (reduce) return;
    let id: ReturnType<typeof setInterval>;
    const t = setTimeout(() => {
      id = setInterval(() => setN((v) => (v >= text.length ? (clearInterval(id), v) : v + 1)), 70);
    }, delay);
    return () => {
      clearTimeout(t);
      clearInterval(id);
    };
  }, [text, delay, reduce]);
  return text.slice(0, n);
}

function ScreenRequest() {
  const { d } = useI18n();
  const company = useTyping("Clean Pro Laundry");
  return (
    <div>
      <motion.p {...pop(0)} className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0096d6]">
        01 · {d.steps.kicker}
      </motion.p>
      <motion.p {...pop(1)} className="mt-2 font-display text-[26px] font-extrabold leading-[1.05] tracking-[-0.03em]">
        {d.steps.items[0].title}
      </motion.p>
      <motion.div {...pop(2)} className="mt-6 rounded-2xl bg-white p-3.5 shadow-[0_10px_30px_-18px_rgba(3,94,148,0.5)] ring-1 ring-[#e3ebf2]">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">{d.steps.phone.company}</p>
        <p className="mt-1 h-[22px] text-[16px] font-bold">
          {company}
          <span className="ml-px inline-block h-[17px] w-[2px] translate-y-[3px] animate-pulse bg-[#0096d6]" />
        </p>
      </motion.div>
      <motion.div {...pop(3)} className="mt-3 rounded-2xl bg-white p-3.5 ring-1 ring-[#e3ebf2]">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">{d.steps.phone.volume}</p>
        <p className="mt-1 flex items-center justify-between text-[16px] font-bold">
          {d.b2b.volumes[2]}
          <svg viewBox="0 0 12 8" className="h-[8px] w-[12px] text-ink-faint" aria-hidden><path d="m1 1 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
        </p>
      </motion.div>
      <motion.div {...pop(4)} className="relative mt-6">
        <motion.span
          animate={{ scale: [1, 0.96, 1] }}
          transition={{ duration: 0.5, delay: 2.2, repeat: Infinity, repeatDelay: 1.8 }}
          className="grid h-[52px] place-items-center rounded-2xl bg-gradient-to-r from-[#035e94] via-[#0096d6] to-[#3fd0ff] text-[15px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(0,150,214,0.8)]"
        >
          {d.steps.phone.send}
        </motion.span>
        {/* Dedo tocando el botón */}
        <motion.span
          className="absolute left-[62%] top-1/2 h-[34px] w-[34px] -translate-y-1/2 rounded-full border-2 border-white bg-white/40"
          animate={{ scale: [0.6, 1.4], opacity: [0.9, 0] }}
          transition={{ duration: 0.9, delay: 2.2, repeat: Infinity, repeatDelay: 1.4 }}
        />
      </motion.div>
      {/* Las dos cajas que va a distribuir */}
      <motion.div {...pop(5)} className="mt-7 flex items-center gap-3 rounded-2xl bg-[#e6f8ff] p-3">
        <span className="flex -space-x-3">
          {(["original", "floral"] as const).map((s, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={s} src={`/products/box-${s}.webp`} alt="" className="h-[58px] w-auto rounded-[4px] shadow-[0_8px_14px_-6px_rgba(0,0,0,0.4)]" style={{ transform: `rotate(${i ? 6 : -6}deg)` }} loading="lazy" decoding="async" />
          ))}
        </span>
        <span className="text-[11px] font-bold leading-snug text-[#035e94]">
          Original Soft Sent
          <br />
          Floral Fantasy
        </span>
      </motion.div>
    </div>
  );
}

function ScreenApproved() {
  const { d } = useI18n();
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", bounce: 0.35, duration: 0.8, delay: 0.2 }}
        className="flex items-center gap-3 rounded-[20px] bg-ink p-3.5 text-white shadow-[0_18px_40px_-16px_rgba(11,27,43,0.7)]"
      >
        <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-[#12b886]">
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
        </span>
        <span>
          <span className="block text-[14px] font-bold">{d.steps.phone.approved}</span>
          <span className="block text-[11px] text-white/60">Snap Slide · B2B</span>
        </span>
      </motion.div>

      <motion.div {...pop(3)} className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-[#e3ebf2]">
        <span className="grid h-[42px] w-[42px] place-items-center rounded-full bg-[#e6f8ff]">
          <LogoMark className="h-[20px] w-[34px]" />
        </span>
        <span className="flex-1">
          <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">{d.steps.phone.seller}</span>
          <span className="block text-[15px] font-bold">Snap Slide Miami</span>
        </span>
        <span className="relative grid h-[34px] w-[34px] place-items-center rounded-full bg-[#0096d6] text-white">
          <span className="absolute inset-0 animate-ping rounded-full bg-[#3fd0ff]/50" />
          <svg viewBox="0 0 24 24" className="relative h-[16px] w-[16px]" fill="currentColor" aria-hidden><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" /></svg>
        </span>
      </motion.div>

      <motion.p {...pop(4)} className="mt-5 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">
        {d.steps.phone.price}
      </motion.p>
      <div className="mt-2 grid grid-cols-2 gap-3">
        {(["original", "floral"] as const).map((s, i) => (
          <motion.div key={s} {...pop(5 + i)} className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#e3ebf2]">
            <div className={`grid h-[110px] place-items-center ${s === "original" ? "bg-gradient-to-br from-[#f4e9ff] to-[#ffe9d6]" : "bg-gradient-to-br from-[#e6f3ff] to-[#cfe7fa]"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/products/box-${s}.webp`} alt="" className="h-[92px] w-auto rounded-[4px] shadow-[0_10px_18px_-8px_rgba(0,0,0,0.45)]" loading="lazy" decoding="async" />
            </div>
            <div className="p-2.5">
              <span className="block truncate text-[11px] font-bold">{s === "original" ? "Original Soft Sent" : "Floral Fantasy"}</span>
              <span className="mt-0.5 flex items-baseline gap-1">
                {/* El precio real lo da el vendedor: aquí se muestra difuminado. */}
                <span className="text-[15px] font-extrabold tracking-tight blur-[4px]">$00.00</span>
                <span className="text-[9px] text-ink-faint">{d.steps.phone.perBox}</span>
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

const BARS = [28, 36, 34, 48, 56, 62, 78, 92];

function ScreenSell() {
  const { d } = useI18n();
  return (
    <div>
      <motion.div {...pop(0)} className="rounded-2xl bg-white p-3.5 ring-1 ring-[#e3ebf2]">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-bold">{d.steps.phone.order} #SS-1042</span>
          <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.7, type: "spring", bounce: 0.5 }}
            className="rounded-full bg-[#12b886]/15 px-2 py-0.5 text-[10px] font-extrabold text-[#0a7d5c]"
          >
            {d.steps.phone.delivered}
          </motion.span>
        </div>
        {/* Camión recorriendo la ruta */}
        <div className="relative mt-4 h-[26px]">
          <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#e3ebf2]" />
          <motion.span className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-gradient-to-r from-[#035e94] to-[#3fd0ff]" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }} />
          <motion.span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-[18px]" initial={{ left: "0%" }} animate={{ left: "100%" }} transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}>
            <svg viewBox="0 0 28 18" className="h-[18px] w-[28px] -scale-x-100 text-ink" aria-hidden><path d="M1 3h15v10H1zM16 6h6l4 4v3h-10z" fill="currentColor" /><circle cx="6" cy="15" r="2.4" fill="#fff" stroke="currentColor" strokeWidth="1.6" /><circle cx="21" cy="15" r="2.4" fill="#fff" stroke="currentColor" strokeWidth="1.6" /></svg>
          </motion.span>
        </div>
        <div className="mt-1 flex justify-between text-[10px] font-bold text-ink-faint">
          <span>Miami, FL</span>
          <span>{d.steps.phone.company}</span>
        </div>
      </motion.div>

      <motion.div {...pop(2)} className="mt-4 rounded-2xl bg-ink p-4 text-white">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">{d.steps.phone.sales}</span>
          <span className="flex items-center gap-1 text-[13px] font-extrabold text-[#3fd0ff]">
            <svg viewBox="0 0 12 12" className="h-[10px] w-[10px]" aria-hidden><path d="M2 9 9 2M4 2h5v5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            {d.steps.items[2].title}
          </span>
        </div>
        <div className="mt-4 flex h-[150px] items-end gap-[7px]">
          {BARS.map((h, i) => (
            <motion.span
              key={i}
              className={`flex-1 rounded-t-[6px] ${i === BARS.length - 1 ? "bg-gradient-to-t from-[#0096d6] to-[#3fd0ff]" : "bg-white/15"}`}
              initial={{ height: "4%" }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.9, delay: 0.5 + i * 0.08, ease: EASE }}
            />
          ))}
        </div>
      </motion.div>

      <motion.span {...pop(4)} className="mt-4 grid h-[48px] place-items-center rounded-2xl bg-gradient-to-r from-[#035e94] via-[#0096d6] to-[#3fd0ff] text-[14px] font-bold text-white">
        + {d.steps.phone.order}
      </motion.span>
    </div>
  );
}
