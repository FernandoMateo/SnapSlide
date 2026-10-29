"use client";

import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { PetalCluster } from "@/components/fx/Petals";
import { WaterTitle } from "@/components/fx/WaterTitle";
import { useI18n } from "@/i18n/I18nProvider";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Values = { company: string; name: string; volume: string; email: string; phone: string; message: string };
const EMPTY: Values = { company: "", name: "", volume: "", email: "", phone: "", message: "" };
const STEPS = ["company", "name", "volume", "contact", "message"] as const;
type Step = (typeof STEPS)[number];

/**
 * Formulario de distribuidores como conversación: una pregunta por pantalla que se disuelve
 * como la hoja en el agua, el panel se llena de agua con el progreso y una credencial 3D
 * "Distribuidor oficial" se completa en vivo con las respuestas.
 */
export function B2BSection() {
  const { d, locale } = useI18n();
  const [values, setValues] = useState<Values>(EMPTY);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const trap = useRef<HTMLInputElement>(null);

  const current: Step = STEPS[step];
  const set = (k: keyof Values) => (v: string) => {
    setValues((s) => ({ ...s, [k]: v }));
    setError("");
  };

  const valid: Record<Step, boolean> = {
    company: values.company.trim().length >= 2,
    name: values.name.trim().length >= 2,
    volume: !!values.volume,
    contact: EMAIL.test(values.email.trim()),
    message: true,
  };

  const go = (delta: number) => {
    setTouched(true);
    setDir(delta);
    setStep((s) => Math.max(0, Math.min(STEPS.length - 1, s + delta)));
  };

  const submit = async () => {
    if (sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, website: trap.current?.value ?? "", locale }),
      });
      if (res.ok) setSent(true);
      else setError(res.status === 429 ? d.b2b.rateError : d.b2b.sendError);
    } catch {
      setError(d.b2b.sendError);
    } finally {
      setSending(false);
    }
  };

  const advance = () => {
    if (!valid[current]) {
      if (current === "contact" && values.email) setError(d.b2b.emailInvalid);
      return;
    }
    if (step === STEPS.length - 1) submit();
    else go(1);
  };

  const reset = () => {
    setValues(EMPTY);
    setStep(0);
    setSent(false);
    setTouched(false);
  };

  const progress = sent ? 1 : step / STEPS.length;

  return (
    <section id="distribucion" className="relative scroll-mt-20 px-3 py-20 sm:px-6 sm:py-24">
      <div
        className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] px-4 py-12 text-white sm:rounded-[40px] sm:px-10 sm:py-16 lg:px-14"
        style={{ background: "radial-gradient(120% 120% at 10% 0%, #0096d6 0%, #035e94 45%, #04213d 100%)" }}
      >
        {/* Burbujas de fondo */}
        <Bubbles />

        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/75">{d.b2b.kicker}</p>
          <div className="relative max-w-3xl">
            <WaterTitle lines={[d.b2b.title]} className="mt-4 font-display text-[clamp(2rem,8.5vw,4.2rem)] font-extrabold leading-[0.98] tracking-[-0.035em] sm:text-[clamp(2.2rem,5vw,4.2rem)]" />
            <PetalCluster className="-top-6 right-0" scale={0.9} />
          </div>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">{d.b2b.lead}</p>
        </div>

        <div className="relative mt-10 grid items-center gap-8 lg:mt-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
          {/* Credencial en vivo */}
          <div>
            <DistributorCard values={values} sent={sent} onAgain={reset} />
            <p className="mt-4 text-center text-xs font-semibold text-white/55">{d.b2b.card.hint}</p>
          </div>

          {/* Conversación */}
          <div className="relative min-h-[430px] overflow-hidden rounded-[28px] bg-white/[0.07] p-5 ring-1 ring-white/15 backdrop-blur-md sm:min-h-[460px] sm:p-8">
            <WaterFill progress={progress} />

            {/* Campo trampa para bots */}
            <input ref={trap} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-px w-px opacity-0" />

            <div className="relative flex h-full min-h-[390px] flex-col sm:min-h-[400px]">
              {/* Indicador de pasos */}
              <div className="flex items-center gap-3">
                <span className="font-display text-sm font-extrabold tabular-nums text-[#7fdcff]">
                  {String(Math.min(step + 1, STEPS.length)).padStart(2, "0")}
                  <span className="text-white/40"> / {String(STEPS.length).padStart(2, "0")}</span>
                </span>
                <span className="flex flex-1 gap-1.5" aria-hidden>
                  {STEPS.map((s, i) => (
                    <span key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
                      <motion.span className="block h-full origin-left bg-[#7fdcff]" initial={false} animate={{ scaleX: sent || i <= step ? 1 : 0 }} transition={{ duration: 0.5, ease: EASE }} />
                    </span>
                  ))}
                </span>
              </div>

              <AnimatePresence mode="wait" custom={dir} initial={false}>
                {sent ? (
                  <motion.div key="sent" initial={{ opacity: 0, y: 30, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.7, ease: EASE }} className="flex flex-1 flex-col justify-center py-8" role="status">
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5, delay: 0.2 }} className="grid h-16 w-16 place-items-center rounded-full bg-white text-[#0096d6] shadow-[0_0_40px_rgba(127,220,255,0.7)]">
                      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
                    </motion.span>
                    <p className="mt-6 font-display text-[clamp(1.8rem,6vw,2.6rem)] font-extrabold leading-tight tracking-[-0.03em]">{d.b2b.card.sentTitle}</p>
                    <p className="mt-3 max-w-md text-white/80">{d.b2b.sent}</p>
                  </motion.div>
                ) : (
                  <motion.form
                    key={current}
                    custom={dir}
                    variants={{
                      enter: (k: number) => ({ opacity: 0, y: k * 40, filter: "blur(12px)" }),
                      center: { opacity: 1, y: 0, filter: "blur(0px)" },
                      exit: (k: number) => ({ opacity: 0, y: k * -40, filter: "blur(14px)", scale: 0.98 }),
                    }}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.45, ease: EASE }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      advance();
                    }}
                    className="flex flex-1 flex-col pt-8"
                    noValidate
                  >
                    <Question step={current} values={values} set={set} autoFocus={touched} onPick={() => setTimeout(() => go(1), 260)} />

                    {error && (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="alert" className="mt-4 rounded-xl bg-[#ff3b5c]/20 px-3 py-2 text-sm font-semibold text-white ring-1 ring-[#ff3b5c]/40">
                        {error}
                      </motion.p>
                    )}

                    <div className="mt-auto flex items-center gap-3 pt-8">
                      {step > 0 && (
                        <button type="button" onClick={() => go(-1)} aria-label={d.b2b.back} className="grid h-13 w-13 shrink-0 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 transition-colors hover:bg-white/20">
                          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 6l-6 6 6 6" /></svg>
                        </button>
                      )}
                      <motion.button
                        type="submit"
                        disabled={sending || (!valid[current] && !(current === "contact" && values.email))}
                        whileTap={{ scale: 0.97 }}
                        className="group relative h-13 flex-1 overflow-hidden rounded-full bg-white px-6 font-display text-base font-bold text-[#035e94] shadow-[0_18px_40px_-14px_rgba(0,0,0,0.5)] transition-opacity disabled:opacity-40 sm:flex-none sm:px-9"
                      >
                        <span className="relative z-10 inline-flex items-center gap-2">
                          {step === STEPS.length - 1 ? (sending ? d.b2b.sending : d.b2b.send) : d.b2b.next}
                          <span className="transition-transform group-hover:translate-x-1" aria-hidden>→</span>
                        </span>
                        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#7fdcff]/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                      </motion.button>
                      {current !== "volume" && <span className="hidden text-xs font-semibold text-white/50 sm:inline">{d.b2b.enter}</span>}
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Pilares */}
        <div className="relative mt-12 grid gap-3 sm:grid-cols-3">
          {d.b2b.pillars.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.6, ease: EASE }}
              className="flex gap-3 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/15"
            >
              <span className="font-display text-2xl font-extrabold leading-none text-[#7fdcff]">{String(i + 1).padStart(2, "0")}</span>
              <span>
                <span className="block font-display text-base font-bold">{p.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-white/70">{p.text}</span>
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── Preguntas ───────── */

const bigInput =
  "field-bare w-full border-0 border-b-2 border-white/25 bg-transparent pb-2 font-display text-[clamp(1.5rem,6vw,2.4rem)] font-bold tracking-[-0.02em] text-white placeholder:text-white/30 outline-none focus:border-[#7fdcff] focus:outline-none focus-visible:outline-none";

function Question({ step, values, set, autoFocus, onPick }: { step: Step; values: Values; set: (k: keyof Values) => (v: string) => void; autoFocus: boolean; onPick: () => void }) {
  const { d } = useI18n();
  const first = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  useEffect(() => {
    if (autoFocus) first.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  const label = (id: string, text: string, optional?: boolean) => (
    <label htmlFor={id} className="block font-display text-[clamp(1.35rem,4.6vw,2rem)] font-bold leading-tight tracking-[-0.02em]">
      {text}
      {optional && <span className="ml-2 align-middle text-xs font-semibold uppercase tracking-[0.14em] text-white/50">{d.b2b.optional}</span>}
    </label>
  );

  if (step === "company")
    return (
      <div>
        {label("company", d.b2b.questions.company)}
        <input ref={(el) => { first.current = el; }} id="company" name="company" autoComplete="organization" value={values.company} onChange={(e) => set("company")(e.target.value)} placeholder={d.b2b.placeholders.company} className={`${bigInput} mt-6`} />
      </div>
    );

  if (step === "name")
    return (
      <div>
        {label("name", d.b2b.questions.name)}
        <input ref={(el) => { first.current = el; }} id="name" name="name" autoComplete="name" value={values.name} onChange={(e) => set("name")(e.target.value)} placeholder={d.b2b.placeholders.name} className={`${bigInput} mt-6`} />
      </div>
    );

  if (step === "volume")
    return (
      <fieldset>
        <legend className="font-display text-[clamp(1.35rem,4.6vw,2rem)] font-bold leading-tight tracking-[-0.02em]">{d.b2b.questions.volume}</legend>
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3">
          {d.b2b.volumes.map((v, i) => {
            const active = values.volume === v;
            return (
              <motion.button
                type="button"
                key={v}
                onClick={() => {
                  set("volume")(v);
                  onPick();
                }}
                aria-pressed={active}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                className={`relative flex min-h-[104px] flex-col justify-between overflow-hidden rounded-2xl p-3.5 text-left transition-colors sm:min-h-[118px] sm:p-4 ${active ? "bg-white text-[#035e94]" : "bg-white/[0.08] text-white ring-1 ring-white/20 hover:bg-white/[0.14]"}`}
              >
                <BoxStack count={i + 1} active={active} />
                <span className="mt-3 text-sm font-bold leading-tight sm:text-base">{v}</span>
              </motion.button>
            );
          })}
        </div>
      </fieldset>
    );

  if (step === "contact")
    return (
      <div className="grid gap-6">
        <p className="font-display text-[clamp(1.35rem,4.6vw,2rem)] font-bold leading-tight tracking-[-0.02em]">{d.b2b.questions.contact}</p>
        <div>
          <label htmlFor="email" className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">{d.b2b.email}</label>
          <input ref={(el) => { first.current = el; }} id="email" name="email" type="email" inputMode="email" autoComplete="email" value={values.email} onChange={(e) => set("email")(e.target.value)} placeholder={d.b2b.placeholders.email} className={`${bigInput} mt-2 !text-[clamp(1.2rem,4.6vw,1.8rem)]`} />
        </div>
        <div>
          <label htmlFor="phone" className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">
            {d.b2b.phone} <span className="text-white/40">· {d.b2b.optional}</span>
          </label>
          <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={values.phone} onChange={(e) => set("phone")(e.target.value)} placeholder={d.b2b.placeholders.phone} className={`${bigInput} mt-2 !text-[clamp(1.2rem,4.6vw,1.8rem)]`} />
        </div>
      </div>
    );

  return (
    <div>
      {label("message", d.b2b.questions.message, true)}
      <textarea
        ref={(el) => { first.current = el; }}
        id="message"
        name="message"
        rows={3}
        value={values.message}
        onChange={(e) => set("message")(e.target.value)}
        onKeyDown={(e) => {
          // Enter envía; Shift+Enter hace salto de línea.
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
        placeholder={d.b2b.placeholders.message}
        className="field-bare mt-6 w-full resize-none rounded-2xl bg-white/[0.08] p-4 text-lg text-white ring-1 ring-white/20 placeholder:text-white/35 outline-none focus:outline-none focus-visible:outline-none focus:ring-2 focus:ring-[#7fdcff]"
      />
    </div>
  );
}

/** Pila de cajitas que crece con el volumen elegido. */
function BoxStack({ count, active }: { count: number; active: boolean }) {
  return (
    <span className="flex h-9 items-end gap-1" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <motion.span
          key={i}
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05 * i, type: "spring", bounce: 0.5 }}
          className={`block w-4 rounded-[3px] ${active ? "bg-gradient-to-b from-[#3fd0ff] to-[#035e94]" : "bg-gradient-to-b from-white/80 to-white/40"}`}
          style={{ height: 14 + i * 6 }}
        />
      ))}
    </span>
  );
}

/* ───────── Agua ───────── */

function WaterFill({ progress }: { progress: number }) {
  const reduce = useReducedMotion();
  // Siempre un poco de agua: el panel nunca se ve vacío.
  const level = 8 + progress * 42;
  return (
    <motion.div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0" initial={false} animate={{ height: `${level}%` }} transition={{ duration: 1.1, ease: EASE }}>
      <svg viewBox="0 0 1200 40" preserveAspectRatio="none" className="absolute -top-[22px] left-0 h-6 w-[200%]">
        <motion.path
          d="M0 20 Q150 0 300 20 T600 20 T900 20 T1200 20 V40 H0Z"
          fill="rgba(127,220,255,0.22)"
          animate={reduce ? undefined : { x: [0, -600] }}
          transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
        />
      </svg>
      <svg viewBox="0 0 1200 40" preserveAspectRatio="none" className="absolute -top-[16px] left-0 h-5 w-[200%]">
        <motion.path
          d="M0 20 Q150 40 300 20 T600 20 T900 20 T1200 20 V40 H0Z"
          fill="rgba(127,220,255,0.16)"
          animate={reduce ? undefined : { x: [-600, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
        />
      </svg>
      <div className="h-full w-full bg-gradient-to-b from-[#7fdcff]/[0.2] to-[#3fd0ff]/[0.08]" />
    </motion.div>
  );
}

const BUBBLES = [
  { l: 6, s: 10, d: 0, t: 11 },
  { l: 18, s: 6, d: 3, t: 9 },
  { l: 34, s: 14, d: 6, t: 13 },
  { l: 52, s: 8, d: 1.5, t: 10 },
  { l: 67, s: 12, d: 4.5, t: 12 },
  { l: 81, s: 7, d: 2.5, t: 9.5 },
  { l: 92, s: 11, d: 7, t: 14 },
];

function Bubbles() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {BUBBLES.map((b, i) => (
        <motion.span
          key={i}
          className="absolute bottom-0 rounded-full border border-white/35 bg-white/10"
          style={{ left: `${b.l}%`, width: b.s, height: b.s }}
          animate={{ y: ["0%", "-1400%"], x: [0, 8, -6, 0], opacity: [0, 0.9, 0.9, 0] }}
          transition={{ duration: b.t, delay: b.d, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

/* ───────── Credencial 3D ───────── */

function DistributorCard({ values, sent, onAgain }: { values: Values; sent: boolean; onAgain: () => void }) {
  const { d } = useI18n();
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [10, -10]), { stiffness: 150, damping: 18 });
  const ry = useSpring(useTransform(px, [0, 1], [-14, 14]), { stiffness: 150, damping: 18 });
  const sheenX = useTransform(px, (v) => `${v * 100}%`);
  const sheenY = useTransform(py, (v) => `${v * 100}%`);
  const sheen = useMotionTemplate`radial-gradient(60% 60% at ${sheenX} ${sheenY}, rgba(255,255,255,0.45), rgba(255,255,255,0) 60%)`;

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  const number = `SS-${new Date().getFullYear()}-${String(values.company.length * 37 + values.name.length * 11).padStart(4, "0").slice(-4)}`;

  return (
    <div className="mx-auto w-full max-w-[340px] [perspective:1200px] sm:max-w-[460px]" onPointerMove={onMove} onPointerLeave={onLeave}>
      <motion.div style={{ rotateX: rx, rotateY: ry }} animate={reduce ? undefined : { y: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
        <motion.div className="relative aspect-[1.586] w-full [transform-style:preserve-3d]" animate={{ rotateY: sent ? 180 : 0 }} transition={{ duration: 1, ease: EASE }}>
          {/* Frente */}
          <div
            className="absolute inset-0 overflow-hidden rounded-[22px] p-5 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)] ring-1 ring-white/30 [backface-visibility:hidden] sm:p-7"
            style={{ background: "linear-gradient(135deg, #035e94 0%, #0096d6 50%, #3fd0ff 100%)" }}
          >
            <motion.span className="pointer-events-none absolute inset-0" style={{ background: sheen }} />
            {/* Holograma de ondas */}
            <svg viewBox="0 0 200 120" className="pointer-events-none absolute -right-10 -bottom-8 h-[85%] opacity-25" aria-hidden>
              {[0, 1, 2, 3, 4].map((i) => (
                <circle key={i} cx="140" cy="90" r={20 + i * 18} fill="none" stroke="white" strokeWidth="1.2" />
              ))}
            </svg>
            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between">
                <Logo className="h-9 sm:h-11" tone="light" />
                <span className="rounded-full bg-white/20 px-2.5 py-1 text-[0.6rem] font-extrabold uppercase tracking-[0.18em] ring-1 ring-white/30 backdrop-blur sm:text-[0.65rem]">{d.b2b.card.label}</span>
              </div>
              <div className="mt-auto">
                <CardLine value={values.company} placeholder={d.b2b.card.company} className="font-display text-[clamp(1.25rem,5.5vw,1.9rem)] font-extrabold leading-tight tracking-[-0.02em]" />
                <CardLine value={values.name} placeholder={d.b2b.card.name} className="mt-1 text-sm font-semibold text-white/85 sm:text-base" />
                <div className="mt-3 flex items-end justify-between gap-3 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white/70 sm:text-[0.7rem]">
                  <span>
                    {d.b2b.card.volume}
                    <CardLine value={values.volume} placeholder="—" className="mt-0.5 block text-xs normal-case tracking-normal text-white sm:text-sm" />
                  </span>
                  <span className="text-right">
                    {d.b2b.card.region}
                    <span className="mt-0.5 block font-mono text-xs tracking-normal text-white sm:text-sm">{number}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Reverso: confirmación */}
          <div
            className="absolute inset-0 grid place-items-center overflow-hidden rounded-[22px] bg-white p-6 text-center text-[#035e94] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)] [backface-visibility:hidden] [transform:rotateY(180deg)]"
          >
            <div>
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-[#035e94] to-[#3fd0ff] text-white">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
              </span>
              <p className="mt-4 font-display text-xl font-extrabold text-ink sm:text-2xl">{values.company || d.b2b.card.company}</p>
              <p className="mt-1 text-sm font-semibold">{d.b2b.card.sentTitle}</p>
              <button onClick={onAgain} className="mt-4 text-xs font-bold text-ink-soft underline-offset-2 hover:underline">{d.b2b.card.again}</button>
            </div>
          </div>
        </motion.div>
      </motion.div>
      {sent && <Burst />}
    </div>
  );
}

/** Texto de la credencial: cada valor nuevo "aparece" desde el agua. */
function CardLine({ value, placeholder, className }: { value: string; placeholder: string; className?: string }) {
  const shown = value.trim() || placeholder;
  return (
    <span className={`block truncate ${className ?? ""}`}>
      <motion.span key={value ? "v" : "p"} initial={{ opacity: 0, filter: "blur(6px)" }} animate={{ opacity: value ? 1 : 0.45, filter: "blur(0px)" }} transition={{ duration: 0.4 }}>
        {shown}
      </motion.span>
    </span>
  );
}

/** Burbujas que estallan al enviar. */
function Burst() {
  return (
    <div aria-hidden className="pointer-events-none relative">
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-[-120px] rounded-full border border-white/70 bg-white/20"
            style={{ width: 8 + (i % 4) * 4, height: 8 + (i % 4) * 4 }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
            animate={{ x: Math.cos(a) * (140 + (i % 3) * 40), y: Math.sin(a) * (90 + (i % 3) * 30) - 40, opacity: 0, scale: 1.2 }}
            transition={{ duration: 1.4, ease: "easeOut", delay: 0.5 }}
          />
        );
      })}
    </div>
  );
}
