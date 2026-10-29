"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { GoalRing } from "@/components/dashboard/charts";
import { Notice, StatusBadge } from "@/components/dashboard/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { saleTotal, salesInMonth, sellerMonthStats } from "@/lib/business";
import { useStore } from "@/lib/store";
import type { User } from "@/lib/types";
import { Initials } from "./Initials";
import { PasswordForm } from "./PasswordForm";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];
const rise = (i: number) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.55, ease: EASE, delay: i * 0.06 } });

/** Perfil de una persona del equipo. `self` habilita editar sus datos y su contraseña. */
export function UserProfile({ user, self, onEdit }: { user: User; self?: boolean; onEdit?: () => void }) {
  const { d, money, date, num } = useI18n();
  const { sales, clients } = useStore((s) => s.db);
  const roleLabel = user.role === "owner" ? d.team.roles.owner : user.role === "seller" ? d.team.roles.seller : d.team.roles.client;
  const isSeller = user.role === "seller";
  const stats = isSeller ? sellerMonthStats(user, sales) : null;
  const mine = isSeller ? sales.filter((s) => s.sellerId === user.id) : [];
  const recent = [...mine].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  const accounts = clients.filter((c) => c.sellerId === user.id).length;

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {/* Cabecera */}
      <motion.section {...rise(0)} className="relative overflow-hidden rounded-[28px] p-6 text-white sm:p-8 lg:col-span-12" style={{ background: "linear-gradient(135deg, #04213d 0%, #035e94 45%, #0096d6 80%, #3fd0ff 100%)" }}>
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/15 blur-3xl" />
        <svg viewBox="0 0 200 120" className="pointer-events-none absolute -bottom-10 right-0 h-[120%] opacity-15" aria-hidden>
          {[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx="160" cy="100" r={18 + i * 18} fill="none" stroke="white" strokeWidth="1" />)}
        </svg>
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <Initials name={user.name} role={user.role} size="xl" />
          <div className="min-w-0 flex-1">
            <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] ring-1 ring-white/25">{roleLabel}</span>
            <h1 className="mt-3 truncate font-display text-[clamp(2rem,5vw,3.2rem)] font-extrabold leading-none tracking-[-0.035em]">{user.name}</h1>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/80">
              <span>{user.email}</span>
              {user.phone && <span>{user.phone}</span>}
              {user.zone && <span>{user.zone}</span>}
              {user.createdAt && <span>{d.profile.since} {date(user.createdAt, { month: "short", year: "numeric" })}</span>}
            </p>
          </div>
          {onEdit && <button onClick={onEdit} className="btn h-11 shrink-0 bg-white px-5 text-sm text-[#035e94]">{d.common.edit}</button>}
        </div>
      </motion.section>

      {stats && (
        <>
          <motion.section {...rise(1)} className="card flex flex-col items-center justify-center p-6 lg:col-span-4">
            <GoalRing progress={stats.progress} size={200}>
              <div>
                <p className="tabular font-display text-4xl font-extrabold tracking-tight">{Math.round(stats.progress * 100)}%</p>
                <p className="mt-1 text-xs font-semibold text-ink-faint">{d.profile.goal} {money(stats.goal)}</p>
              </div>
            </GoalRing>
          </motion.section>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
            <Kpi i={2} label={d.profile.month} value={money(stats.total)} big />
            <Kpi i={3} label={d.profile.commission} value={money(stats.commission)} />
            <Kpi i={4} label={d.profile.orders} value={num(salesInMonth(mine).length)} />
            <Kpi i={5} label={d.profile.clients} value={num(accounts)} />
          </div>

          <motion.section {...rise(6)} className="card p-6 lg:col-span-12">
            <h2 className="font-display text-xl font-bold tracking-tight">{d.profile.recent}</h2>
            <ul className="mt-4 divide-y divide-line">
              {recent.length === 0 && <li className="py-6 text-center text-sm text-ink-faint">{d.common.none}</li>}
              {recent.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{clients.find((c) => c.id === s.clientId)?.company}</span>
                    <span className="block text-xs text-ink-faint">{s.number} · {date(s.date)}{s.channel === "portal" ? ` · ${d.portal.viaPortal}` : ""}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <StatusBadge status={s.status} />
                    <span className="tabular w-24 text-right text-sm font-bold">{money(saleTotal(s))}</span>
                  </span>
                </li>
              ))}
            </ul>
          </motion.section>
        </>
      )}

      {self && (
        <>
          <motion.section {...rise(7)} className="card p-6 lg:col-span-5">
            <h2 className="font-display text-xl font-bold tracking-tight">{d.account.details}</h2>
            <ProfileForm user={user} />
          </motion.section>
          <motion.section {...rise(8)} className="card p-6 lg:col-span-7">
            <h2 className="mb-4 font-display text-xl font-bold tracking-tight">{d.account.security}</h2>
            <PasswordForm />
          </motion.section>
        </>
      )}
    </div>
  );
}

function Kpi({ i, label, value, big }: { i: number; label: string; value: string; big?: boolean }) {
  return (
    <motion.div {...rise(i)} className={big ? "relative overflow-hidden rounded-[24px] p-6 text-white" : "card p-6"} style={big ? { background: "linear-gradient(160deg, #06203a 0%, #04121f 100%)" } : undefined}>
      <p className={`label ${big ? "!text-white/60" : ""}`}>{label}</p>
      <p className="tabular mt-2 font-display text-3xl font-extrabold tracking-tight">{value}</p>
    </motion.div>
  );
}

function ProfileForm({ user }: { user: User }) {
  const { d, t } = useI18n();
  const updateProfile = useStore((s) => s.updateProfile);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  return (
    <form
      className="mt-4 grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const res = await updateProfile({ name, phone });
        setMsg(res.ok ? { kind: "success", text: d.account.saved } : { kind: "error", text: t(res.error) });
      }}
    >
      <div>
        <label className="label" htmlFor="p-name">{d.account.name}</label>
        <input id="p-name" className="field" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
      </div>
      <div>
        <label className="label" htmlFor="p-phone">{d.account.phone}</label>
        <input id="p-phone" type="tel" className="field" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="p-email">{d.account.email}</label>
        <input id="p-email" className="field bg-[#f2f7fb]" value={user.email} readOnly />
        <p className="mt-1 text-xs text-ink-faint">{d.account.emailHint}</p>
      </div>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <button type="submit" className="btn btn-dark h-11 text-sm">{d.account.saveProfile}</button>
    </form>
  );
}
