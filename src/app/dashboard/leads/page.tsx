"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Drawer, Notice, PageHeader, SearchInput } from "@/components/dashboard/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { can } from "@/lib/business";
import { LEAD_STEPS, useLeads } from "@/lib/leads";
import { useCurrentUser, useStore } from "@/lib/store";
import type { Lead, LeadStatus } from "@/lib/types";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];
const GRADIENT_TEXT: React.CSSProperties = {
  backgroundImage: "linear-gradient(135deg, #035e94 0%, #0096d6 50%, #3fd0ff 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

type Filter = LeadStatus | "all";

export default function LeadsPage() {
  const { d } = useI18n();
  const user = useCurrentUser()!;
  const { leads, status, load } = useLeads();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const c: Record<LeadStatus, number> = { new: 0, contacted: 0, active: 0, rejected: 0 };
    for (const l of leads) c[l.status]++;
    return c;
  }, [leads]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter(
      (l) =>
        (filter === "all" ? l.status !== "rejected" : l.status === filter) &&
        (!q || `${l.company} ${l.name} ${l.email}`.toLowerCase().includes(q)),
    );
  }, [leads, filter, query]);

  if (!can(user, "leads.manage")) return <Notice kind="error">{d.perm.denied}</Notice>;

  const open = leads.find((l) => l.id === openId) ?? null;

  return (
    <>
      <PageHeader
        title={d.leads.title}
        subtitle={d.leads.subtitle}
        actions={
          status === "ready" && (
            <button onClick={() => setCreating(true)} className="btn btn-primary h-11 px-5 text-sm">
              + {d.leads.add}
            </button>
          )
        }
      />

      {(status === "idle" || status === "loading") && <Skeleton />}
      {status === "locked" && <LockCard />}
      {status === "unconfigured" && <Notice kind="error">{d.leads.unconfigured}</Notice>}
      {status === "error" && (
        <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="text-sm font-semibold text-danger">{d.leads.loadError}</p>
          <button onClick={load} className="btn btn-ghost h-10 text-sm">{d.leads.retry}</button>
        </div>
      )}

      {status === "ready" && (
        <>
          {/* Embudo: los 3 pasos de la landing convertidos en etapas de trabajo */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {LEAD_STEPS.map((s, i) => (
              <StageCard key={s} step={s} index={i} count={counts[s]} selected={filter === s} onClick={() => setFilter(filter === s ? "all" : s)} last={i === LEAD_STEPS.length - 1} />
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Chip active={filter === "all"} onClick={() => setFilter("all")}>
                {d.leads.all} · {leads.length - counts.rejected}
              </Chip>
              <Chip active={filter === "rejected"} onClick={() => setFilter("rejected")}>
                {d.leads.rejected} · {counts.rejected}
              </Chip>
            </div>
            <SearchInput value={query} onChange={setQuery} placeholder={d.leads.search} />
          </div>

          {visible.length === 0 ? (
            <div className="card mt-4 grid place-items-center px-6 py-16 text-center">
              <EmptyArt />
              <p className="mt-5 max-w-md text-sm text-ink-soft">{leads.length ? d.leads.empty : d.leads.emptyAll}</p>
            </div>
          ) : (
            <motion.ul layout className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence initial={false}>
                {visible.map((l, i) => (
                  <LeadCard key={l.id} lead={l} index={i} onOpen={() => setOpenId(l.id)} />
                ))}
              </AnimatePresence>
            </motion.ul>
          )}

          <LockAgain />
        </>
      )}

      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open?.company ?? ""} wide>
        {open && <LeadDetail lead={open} onDeleted={() => setOpenId(null)} />}
      </Drawer>
      <Drawer open={creating} onClose={() => setCreating(false)} title={d.leads.add}>
        <CreateLead onDone={() => setCreating(false)} />
      </Drawer>
    </>
  );
}

/* ───────── Embudo ───────── */

function StageCard({ step, index, count, selected, onClick, last }: { step: LeadStatus; index: number; count: number; selected: boolean; onClick: () => void; last: boolean }) {
  const { d, num } = useI18n();
  const info = d.leads.steps[step];
  return (
    <div className="relative">
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE, delay: index * 0.08 }}
      onClick={onClick}
      aria-pressed={selected}
      className={`group relative block h-full w-full overflow-hidden rounded-[20px] p-3.5 text-left transition-shadow sm:rounded-[24px] sm:p-6 ${selected ? "text-white shadow-[0_24px_50px_-24px_rgba(3,16,31,0.9)]" : "card hover:shadow-[0_24px_50px_-28px_rgba(3,94,148,0.5)]"}`}
      style={selected ? { background: "linear-gradient(160deg, #06203a 0%, #04121f 100%)" } : undefined}
    >
      {selected && <span className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00bfff]/30 blur-3xl" />}
      <span className="relative flex items-start justify-between gap-3">
        <span
          className="font-display text-[2.6rem] font-extrabold leading-[0.8] tracking-[-0.07em] sm:text-[4.5rem] lg:text-[5.5rem]"
          style={selected ? { color: "#3fd0ff" } : GRADIENT_TEXT}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className={`tabular rounded-full px-2 py-0.5 font-display text-sm font-extrabold sm:px-3 sm:py-1 sm:text-lg ${selected ? "bg-white/10 text-white" : "bg-[#e6f8ff] text-[#035e94]"}`}>{num(count)}</span>
      </span>
      <span className="relative mt-3 block font-display text-[0.8rem] font-bold leading-tight sm:mt-4 sm:text-lg">{info.title}</span>
      <span className={`relative mt-1 hidden text-sm sm:block ${selected ? "text-white/65" : "text-ink-soft"}`}>{info.hint}</span>
    </motion.button>
      {!last && (
        <span aria-hidden className="absolute -right-1.5 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 translate-x-1/2 place-items-center rounded-full bg-white font-bold text-[#0096d6] shadow-md ring-1 ring-line md:grid">
          →
        </span>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-pressed={active} className={`h-9 rounded-full px-4 text-sm font-bold transition-colors ${active ? "bg-ink text-white" : "bg-white text-ink-soft ring-1 ring-line hover:text-ink"}`}>
      {children}
    </button>
  );
}

/* ───────── Tarjeta ───────── */

function useAgo() {
  const { locale } = useI18n();
  return (iso: string) => {
    const rtf = new Intl.RelativeTimeFormat(locale === "es" ? "es" : "en", { numeric: "auto" });
    const s = (new Date(iso).getTime() - Date.now()) / 1000;
    const units: [Intl.RelativeTimeFormatUnit, number][] = [["day", 86400], ["hour", 3600], ["minute", 60]];
    for (const [u, sec] of units) if (Math.abs(s) >= sec) return rtf.format(Math.round(s / sec), u);
    return rtf.format(0, "minute");
  };
}

function Progress({ status }: { status: LeadStatus }) {
  const reached = status === "rejected" ? -1 : LEAD_STEPS.indexOf(status);
  return (
    <span className="flex gap-1.5" aria-hidden>
      {LEAD_STEPS.map((s, i) => (
        <span key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e3ebf2]">
          <motion.span className="block h-full origin-left bg-gradient-to-r from-[#035e94] to-[#3fd0ff]" initial={false} animate={{ scaleX: i <= reached ? 1 : 0 }} transition={{ duration: 0.6, ease: EASE }} />
        </span>
      ))}
    </span>
  );
}

function LeadCard({ lead, index, onOpen }: { lead: Lead; index: number; onOpen: () => void }) {
  const { d } = useI18n();
  const ago = useAgo();
  const update = useLeads((s) => s.update);
  const seller = useStore((s) => s.db.users.find((u) => u.id === lead.sellerId));
  const step = LEAD_STEPS.indexOf(lead.status);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE, delay: Math.min(index, 8) * 0.04 } }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
    >
      <div role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen())} className="card group flex h-full cursor-pointer flex-col p-5 transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-sky">
        <div className="flex items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="block truncate font-display text-lg font-bold tracking-tight">{lead.company}</span>
            <span className="block truncate text-sm text-ink-soft">{lead.name}</span>
          </span>
          <span className="shrink-0 font-display text-3xl font-extrabold leading-none tracking-[-0.06em]" style={lead.status === "rejected" ? { color: "#c3ced8" } : GRADIENT_TEXT}>
            {lead.status === "rejected" ? "×" : String(step + 1).padStart(2, "0")}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs font-bold">
          {lead.volume && <span className="rounded-full bg-[#e6f8ff] px-2.5 py-1 text-[#035e94]">{lead.volume}</span>}
          <span className="rounded-full bg-[#f2f7fb] px-2.5 py-1 text-ink-soft">{d.leads.source[lead.source]}</span>
          <span className="ml-auto font-semibold text-ink-faint">{ago(lead.createdAt)}</span>
        </div>

        <div className="mt-4">
          <Progress status={lead.status} />
          <p className="mt-2 text-xs font-bold text-ink-soft">{d.leads.steps[lead.status].title}</p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <span className="flex min-w-0 items-center gap-2 text-xs font-semibold text-ink-soft">
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[0.7rem] font-extrabold ${seller ? "bg-gradient-to-br from-[#0096d6] to-[#3fd0ff] text-white" : "bg-[#f2f7fb] text-ink-faint ring-1 ring-line"}`}>
              {seller ? seller.name[0] : "?"}
            </span>
            <span className="truncate">{seller ? seller.name : d.leads.unassigned}</span>
          </span>
          {lead.status === "new" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                update(lead.id, { status: "contacted" });
              }}
              className="shrink-0 rounded-full bg-ink px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#035e94]"
            >
              {d.leads.next} →
            </button>
          )}
        </div>
      </div>
    </motion.li>
  );
}

/* ───────── Detalle ───────── */

function LeadDetail({ lead, onDeleted }: { lead: Lead; onDeleted: () => void }) {
  const { d, locale } = useI18n();
  const { update, remove } = useLeads();
  const users = useStore((s) => s.db.users);
  const sellers = useMemo(() => users.filter((u) => u.role === "seller"), [users]);
  const saveClient = useStore((s) => s.saveClient);
  const [notes, setNotes] = useState(lead.notes);
  const [makeClient, setMakeClient] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => setNotes(lead.notes), [lead.id, lead.notes]);

  const save = async (patch: Parameters<typeof update>[1]) => setError(!(await update(lead.id, patch)));
  const digits = lead.phone.replace(/\D/g, "");
  const current = LEAD_STEPS.indexOf(lead.status);
  const received = new Date(lead.createdAt).toLocaleString(locale === "es" ? "es-US" : "en-US", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const activate = async () => {
    let clientId = lead.clientId;
    if (makeClient && !clientId) {
      const res = await saveClient({
        id: "",
        company: lead.company,
        contact: lead.name,
        phone: lead.phone,
        email: lead.email,
        address: "",
        city: "Miami",
        zip: "",
        sellerId: lead.sellerId || sellers[0]?.id || "",
        paymentTerms: 30,
        createdAt: "",
      });
      if (res.ok && res.id) clientId = res.id;
    }
    await save({ status: "active", clientId });
  };

  return (
    <div className="grid gap-6">
      {error && <Notice kind="error">{d.leads.saveError}</Notice>}

      <div>
        <p className="text-sm text-ink-soft">{lead.name}</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <ContactButton href={digits ? `tel:${digits}` : undefined} label={d.leads.call} icon={<path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z" fill="currentColor" />} />
          <ContactButton href={digits ? `https://wa.me/${digits}` : undefined} label={d.leads.whatsapp} icon={<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />} />
          <ContactButton href={`mailto:${lead.email}`} label={d.leads.email} icon={<path d="M3 6h18v12H3zM3 7l9 6 9-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />} />
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl bg-[#f2f7fb] p-4 text-sm">
        <Info label={d.b2b.email} value={lead.email} />
        <Info label={d.b2b.phone} value={lead.phone || "—"} />
        <Info label={d.leads.volume} value={lead.volume || "—"} />
        <Info label={d.leads.received} value={`${received} · ${d.leads.source[lead.source]}`} />
      </dl>

      <div>
        <p className="label">{d.leads.message}</p>
        <p className={`mt-1 rounded-2xl rounded-tl-md bg-[#e6f8ff] px-4 py-3 text-sm leading-relaxed ${lead.message ? "text-ink" : "text-ink-faint"}`}>{lead.message || d.leads.noMessage}</p>
      </div>

      {/* Los 3 pasos, con la acción del paso actual */}
      {lead.status === "rejected" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-line p-4">
          <span className="font-display text-lg font-bold text-ink-soft">{d.leads.steps.rejected.title}</span>
          <button onClick={() => save({ status: "new" })} className="btn btn-ghost h-10 text-sm">{d.leads.reopen}</button>
        </div>
      ) : (
        <ol className="grid">
          {LEAD_STEPS.map((s, i) => {
            const done = i < current || (i === current && s === "active");
            const isCurrent = i === current && s !== "active";
            return (
              <li key={s} className="relative grid grid-cols-[4.5rem_1fr] gap-4 pb-6 last:pb-0">
                {i < LEAD_STEPS.length - 1 && (
                  <span className="absolute left-[2.1rem] top-[3.6rem] bottom-1 w-0.5 overflow-hidden rounded-full bg-[#e3ebf2]">
                    <motion.span className="block h-full w-full origin-top bg-gradient-to-b from-[#0096d6] to-[#3fd0ff]" initial={false} animate={{ scaleY: i < current ? 1 : 0 }} transition={{ duration: 0.6, ease: EASE }} />
                  </span>
                )}
                <span
                  className="font-display text-[3.4rem] font-extrabold leading-none tracking-[-0.07em]"
                  style={done || isCurrent ? GRADIENT_TEXT : { color: "#d6e2ec" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className={`rounded-2xl p-4 ${isCurrent ? "bg-white shadow-[0_18px_40px_-24px_rgba(3,94,148,0.55)] ring-1 ring-sky/30" : ""}`}>
                  <p className={`flex items-center gap-2 font-display text-lg font-bold ${done || isCurrent ? "text-ink" : "text-ink-faint"}`}>
                    {d.leads.steps[s].title}
                    {done && (
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-ok text-white">
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-soft">{d.leads.steps[s].hint}</p>

                  {isCurrent && s === "new" && (
                    <div className="mt-4 grid gap-3">
                      <SellerSelect value={lead.sellerId} sellers={sellers} onChange={(sellerId) => save({ sellerId })} />
                      <button onClick={() => save({ status: "contacted" })} className="btn btn-primary h-11 text-sm">{d.leads.advance.new} →</button>
                    </div>
                  )}
                  {isCurrent && s === "contacted" && (
                    <div className="mt-4 grid gap-3">
                      <SellerSelect value={lead.sellerId} sellers={sellers} onChange={(sellerId) => save({ sellerId })} />
                      {!lead.clientId && (
                        <label className="flex items-center gap-2.5 text-sm font-semibold text-ink-soft">
                          <input type="checkbox" checked={makeClient} onChange={(e) => setMakeClient(e.target.checked)} className="h-4 w-4 accent-[#0096d6]" />
                          {d.leads.createClient}
                        </label>
                      )}
                      <button onClick={activate} className="btn btn-primary h-11 text-sm">{d.leads.advance.contacted} →</button>
                    </div>
                  )}
                  {s === "active" && lead.status === "active" && lead.clientId && (
                    <p className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-[#0a7d5c]">
                      {d.leads.clientCreated} ·
                      <Link href="/dashboard/clients" className="text-sky-deep underline-offset-2 hover:underline">{d.leads.viewClients} →</Link>
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div>
        <label className="label" htmlFor="lead-notes">{d.leads.notes}</label>
        <textarea id="lead-notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== lead.notes && save({ notes })} className="field resize-y" />
        <p className="mt-1 text-xs text-ink-faint">{d.leads.notesHint}</p>
      </div>

      <div className="flex flex-wrap justify-between gap-2 border-t border-line pt-5">
        {lead.status !== "rejected" ? (
          <button onClick={() => save({ status: "rejected" })} className="btn btn-ghost h-10 text-sm">{d.leads.reject}</button>
        ) : (
          <span />
        )}
        <button
          onClick={async () => {
            if (!window.confirm(d.leads.removeConfirm)) return;
            if (await remove(lead.id)) onDeleted();
            else setError(true);
          }}
          className="h-10 rounded-full px-4 text-sm font-bold text-danger hover:bg-danger/10"
        >
          {d.leads.remove}
        </button>
      </div>
    </div>
  );
}

function SellerSelect({ value, sellers, onChange }: { value: string; sellers: { id: string; name: string }[]; onChange: (id: string) => void }) {
  const { d } = useI18n();
  return (
    <div>
      <label className="label" htmlFor="lead-seller">{d.leads.seller}</label>
      <select id="lead-seller" value={value} onChange={(e) => onChange(e.target.value)} className="field">
        <option value="">{d.leads.unassigned}</option>
        {sellers.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </div>
  );
}

function ContactButton({ href, label, icon }: { href?: string; label: string; icon: React.ReactNode }) {
  const cls = "flex h-16 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-bold transition-colors";
  const inner = (
    <>
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>{icon}</svg>
      {label}
    </>
  );
  if (!href) return <span className={`${cls} bg-[#f2f7fb] text-ink-faint`} aria-disabled>{inner}</span>;
  return (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className={`${cls} bg-[#e6f8ff] text-[#035e94] hover:bg-[#035e94] hover:text-white`}>
      {inner}
    </a>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-ink-faint">{label}</dt>
      <dd className="mt-0.5 break-words font-semibold">{value}</dd>
    </div>
  );
}

/* ───────── Alta manual ───────── */

function CreateLead({ onDone }: { onDone: () => void }) {
  const { d, locale } = useI18n();
  const create = useLeads((s) => s.create);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  return (
    <form
      className="grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
        const res = await create({ company: f.company, name: f.name, email: f.email, phone: f.phone, volume: f.volume, message: f.message, locale });
        setBusy(false);
        if (res.ok) onDone();
        else setError(true);
      }}
    >
      {error && <Notice kind="error">{d.b2b.sendError}</Notice>}
      <FormField label={d.b2b.company} name="company" required minLength={2} />
      <FormField label={d.b2b.name} name="name" required minLength={2} />
      <FormField label={d.b2b.email} name="email" type="email" required />
      <FormField label={d.b2b.phone} name="phone" type="tel" />
      <div>
        <label className="label" htmlFor="lead-volume">{d.b2b.volume}</label>
        <select id="lead-volume" name="volume" className="field">
          {d.b2b.volumes.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="lead-message">{d.b2b.message}</label>
        <textarea id="lead-message" name="message" rows={3} className="field resize-none" />
      </div>
      <button type="submit" disabled={busy} className="btn btn-primary mt-2 h-12 text-sm">
        {busy ? d.b2b.sending : d.leads.add}
      </button>
    </form>
  );
}

function FormField({ label, name, ...rest }: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="label" htmlFor={`lead-${name}`}>{label}</label>
      <input id={`lead-${name}`} name={name} className="field" {...rest} />
    </div>
  );
}

/* ───────── Acceso ───────── */

function LockCard() {
  const { d } = useI18n();
  const { unlock, badKey } = useLeads();
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="card mx-auto mt-4 max-w-lg overflow-hidden p-7 text-center sm:p-10">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl text-white shadow-[0_16px_30px_-12px_rgba(0,150,214,0.8)]" style={{ background: "linear-gradient(135deg, #035e94, #3fd0ff)" }}>
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="5" y="11" width="14" height="10" rx="2.5" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      </span>
      <h2 className="mt-6 font-display text-2xl font-bold tracking-tight">{d.leads.lockTitle}</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{d.leads.lockText}</p>
      <form
        className="mt-6 grid gap-3 text-left"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!key.trim()) return;
          setBusy(true);
          await unlock(key);
          setBusy(false);
        }}
      >
        <label className="label" htmlFor="leads-key">{d.leads.keyLabel}</label>
        <input id="leads-key" type="password" autoComplete="current-password" value={key} onChange={(e) => setKey(e.target.value)} className="field" />
        {badKey && <Notice kind="error">{d.leads.badKey}</Notice>}
        <button type="submit" disabled={busy || !key.trim()} className="btn btn-primary h-12 text-sm">{d.leads.unlock}</button>
      </form>
    </div>
  );
}

function LockAgain() {
  const { d } = useI18n();
  const lock = useLeads((s) => s.lock);
  return (
    <div className="mt-10 text-center">
      <button onClick={lock} className="text-xs font-semibold text-ink-faint hover:text-ink">🔒 {d.leads.lockAgain}</button>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="card h-48 animate-pulse bg-white/60" />
      ))}
    </div>
  );
}

function EmptyArt() {
  return (
    <span className="relative grid h-20 w-20 place-items-center rounded-3xl bg-[#e6f8ff]">
      <span className="absolute inset-0 animate-ping rounded-3xl bg-[#3fd0ff]/20" style={{ animationDuration: "2.6s" }} />
      <svg viewBox="0 0 24 24" className="relative h-9 w-9 text-[#0096d6]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 13h4l1.5 3h5L16 13h4M4 13l2.5-7.5A2 2 0 0 1 8.4 4h7.2a2 2 0 0 1 1.9 1.5L20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5Z" />
      </svg>
    </span>
  );
}
