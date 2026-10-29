"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { PetalCluster } from "@/components/fx/Petals";
import { WaterTitle } from "@/components/fx/WaterTitle";
import { useI18n } from "@/i18n/I18nProvider";

/** Puntos de distribución abstractos alrededor de Miami (posiciones decorativas, no geográficas). */
const NODES = [
  { x: 50, y: 50, r: 10 },
  { x: 32, y: 30, r: 5 },
  { x: 68, y: 26, r: 6 },
  { x: 76, y: 58, r: 5 },
  { x: 24, y: 64, r: 6 },
  { x: 58, y: 78, r: 4 },
  { x: 42, y: 14, r: 4 },
];

export function B2BSection() {
  const { d, locale } = useI18n();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  return (
    <section id="distribucion" className="relative scroll-mt-20 px-3 py-24 sm:px-6">
      <div
        className="relative mx-auto max-w-7xl overflow-hidden rounded-[36px] px-5 py-16 text-white sm:px-12 sm:py-20"
        style={{ background: "radial-gradient(120% 120% at 15% 0%, #00BFFF 0%, #0A7FE0 40%, #0A3FBF 100%)" }}
      >
        <div className="relative grid gap-14 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/75">{d.b2b.kicker}</p>
            <div className="relative">
              <WaterTitle
                lines={[d.b2b.title]}
                className="mt-5 font-display text-[clamp(2.1rem,9vw,4.2rem)] font-extrabold leading-[0.98] tracking-[-0.035em] sm:text-[clamp(2.2rem,5vw,4.2rem)]"
              />
              <PetalCluster className="-top-8 right-0" scale={0.9} />
            </div>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/85">{d.b2b.lead}</p>

            <DistributionRadar />

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {d.b2b.pillars.map((p, i) => (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur"
                >
                  <h3 className="font-display text-base font-bold">{p.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/80">{p.text}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="glass relative self-start rounded-[28px] p-6 text-ink sm:p-8">
            <AnimatePresence mode="wait" initial={false}>
              {sent ? (
                <motion.div key="ok" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="grid min-h-[420px] place-items-center text-center">
                  <div>
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.4 }} className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sky text-white shadow-[var(--shadow-glow)]">
                      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
                    </motion.span>
                    <p className="mx-auto mt-6 max-w-xs font-display text-xl font-bold">{d.b2b.sent}</p>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  exit={{ opacity: 0, scale: 0.98 }}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (sending) return;
                    setSending(true);
                    setError("");
                    try {
                      const body = Object.fromEntries(new FormData(e.currentTarget));
                      const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, locale }) });
                      if (res.ok) setSent(true);
                      else setError(res.status === 429 ? d.b2b.rateError : d.b2b.sendError);
                    } catch {
                      setError(d.b2b.sendError);
                    } finally {
                      setSending(false);
                    }
                  }}
                  className="grid gap-4"
                >
                  <h3 className="font-display text-2xl font-bold tracking-tight">{d.b2b.formTitle}</h3>
                  {/* Campo trampa para bots: invisible para personas y lectores de pantalla */}
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-px w-px opacity-0" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={d.b2b.company} name="company" required autoComplete="organization" />
                    <Field label={d.b2b.name} name="name" required autoComplete="name" />
                    <Field label={d.b2b.email} name="email" type="email" required autoComplete="email" />
                    <Field label={d.b2b.phone} name="phone" type="tel" autoComplete="tel" />
                  </div>
                  <div>
                    <label className="label" htmlFor="volume">{d.b2b.volume}</label>
                    <select id="volume" name="volume" className="field">
                      {d.b2b.volumes.map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label" htmlFor="message">{d.b2b.message}</label>
                    <textarea id="message" name="message" rows={3} className="field resize-none" />
                  </div>
                  {error && (
                    <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
                      {error}
                    </p>
                  )}
                  <button type="submit" disabled={sending} className="btn btn-primary mt-2 h-13 w-full text-base">
                    {sending ? d.b2b.sending : d.b2b.send}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({ label, name, ...rest }: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} className="field" {...rest} />
    </div>
  );
}

function DistributionRadar() {
  return (
    <div className="relative mt-10 aspect-[16/9] max-w-lg overflow-hidden rounded-3xl bg-white/5 ring-1 ring-white/15">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
        {NODES.slice(1).map((n, i) => (
          <motion.line
            key={i}
            x1={50}
            y1={50}
            x2={n.x}
            y2={n.y}
            stroke="rgba(255,255,255,0.45)"
            strokeWidth={0.3}
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 + i * 0.12, ease: "easeOut" }}
          />
        ))}
      </svg>
      {[1, 2, 3].map((ring) => (
        <span key={ring} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15" style={{ width: `${ring * 30}%`, aspectRatio: "1" }} />
      ))}
      {NODES.map((n, i) => (
        <span key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${n.x}%`, top: `${n.y}%` }}>
          <span className="absolute inset-0 animate-ping rounded-full bg-white/60" style={{ animationDelay: `${i * 0.35}s`, animationDuration: "2.4s" }} />
          <span className="relative block rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,0.9)]" style={{ width: n.r, height: n.r }} />
        </span>
      ))}
      <span className="absolute left-1/2 top-[calc(50%+14px)] -translate-x-1/2 rounded-full bg-white px-2.5 py-0.5 text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-abyss">Miami, FL</span>
    </div>
  );
}
