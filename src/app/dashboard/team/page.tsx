"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Initials } from "@/components/account/Initials";
import { UserDrawer } from "@/components/account/UserDrawer";
import { Notice, PageHeader } from "@/components/dashboard/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { can, sellerMonthStats } from "@/lib/business";
import { useCurrentUser, useStore } from "@/lib/store";
import type { Role, User } from "@/lib/types";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];
const GROUPS: Role[] = ["owner", "seller", "client"];

export default function TeamPage() {
  const { d } = useI18n();
  const me = useCurrentUser()!;
  const { users, clients, sales } = useStore((s) => s.db);
  const [editing, setEditing] = useState<User | null>(null);
  const [creating, setCreating] = useState<Role | null>(null);

  const grouped = useMemo(() => {
    const g: Record<Role, User[]> = { owner: [], seller: [], client: [] };
    for (const u of users) g[u.role].push(u);
    for (const r of GROUPS) g[r].sort((a, b) => Number(b.active !== false) - Number(a.active !== false) || a.name.localeCompare(b.name));
    return g;
  }, [users]);

  if (!can(me, "users.manage")) return <Notice kind="error">{d.perm.denied}</Notice>;

  return (
    <>
      <PageHeader
        title={d.team.title}
        subtitle={d.team.subtitle}
        actions={<button onClick={() => setCreating("seller")} className="btn btn-primary h-11 px-5 text-sm">+ {d.team.add}</button>}
      />

      <div className="grid gap-10">
        {GROUPS.map((role) => (
          <section key={role}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
                {d.team.groups[role]}
                <span className="rounded-full bg-[#e6f8ff] px-2.5 py-0.5 text-sm font-extrabold text-[#035e94]">{grouped[role].length}</span>
              </h2>
              <button onClick={() => setCreating(role)} className="text-sm font-bold text-sky-deep hover:underline">+ {d.team.roles[role]}</button>
            </div>
            {grouped[role].length === 0 ? (
              <p className="card px-5 py-8 text-center text-sm text-ink-faint">{d.team.empty}</p>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {grouped[role].map((u, i) => (
                  <PersonCard key={u.id} user={u} index={i} isMe={u.id === me.id} company={clients.find((c) => c.id === u.clientId)?.company} stats={u.role === "seller" ? sellerMonthStats(u, sales) : null} onEdit={() => setEditing(u)} />
                ))}
              </ul>
            )}
          </section>
        ))}

        <DangerZone />
      </div>

      <UserDrawer open={!!editing || !!creating} onClose={() => { setEditing(null); setCreating(null); }} user={editing} defaultRole={creating ?? "seller"} />
    </>
  );
}

function PersonCard({ user, index, isMe, company, stats, onEdit }: { user: User; index: number; isMe: boolean; company?: string; stats: ReturnType<typeof sellerMonthStats> | null; onEdit: () => void }) {
  const { d, money } = useI18n();
  const inactive = user.active === false;
  return (
    <motion.li initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE, delay: Math.min(index, 8) * 0.04 }} className={`card flex flex-col p-5 ${inactive ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        <Initials name={user.name} role={user.role} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-bold leading-tight">
            {user.name} {isMe && <span className="text-sm font-semibold text-ink-faint">· {d.dash.profile}</span>}
          </p>
          <p className="truncate text-sm text-ink-soft">{user.email}</p>
          {company && <p className="mt-0.5 truncate text-sm font-semibold text-[#035e94]">{company}</p>}
          {user.zone && <p className="mt-0.5 truncate text-xs font-semibold text-ink-faint">{user.zone}</p>}
        </div>
      </div>

      {stats && (
        <div className="mt-4">
          <div className="flex items-baseline justify-between text-sm">
            <span className="tabular font-display text-xl font-extrabold">{money(stats.total)}</span>
            <span className="text-xs font-bold text-ink-faint">{Math.round(stats.progress * 100)}% · {money(stats.goal)}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e3ebf2]">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-[#035e94] to-[#3fd0ff]" initial={{ width: 0 }} animate={{ width: `${Math.min(100, stats.progress * 100)}%` }} transition={{ duration: 0.9, ease: EASE }} />
          </div>
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        <span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-extrabold ${inactive ? "bg-danger/10 text-danger" : "bg-ok/12 text-[#0a7d5c]"}`}>{inactive ? d.team.inactive : d.team.active}</span>
        {user.mustChangePassword && <span className="rounded-full bg-warn/15 px-2.5 py-1 text-[0.68rem] font-extrabold text-[#b86b00]">{d.team.mustChange}</span>}
        <span className="ml-auto flex gap-1">
          {user.role === "seller" && <Link href={`/dashboard/team/${user.id}`} className="rounded-full px-3 py-1.5 text-xs font-bold text-sky-deep hover:bg-sky-soft">{d.team.viewProfile}</Link>}
          <button onClick={onEdit} className="rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-white hover:bg-[#035e94]">{d.common.edit}</button>
        </span>
      </div>
    </motion.li>
  );
}

function DangerZone() {
  const { d } = useI18n();
  const clearDemoData = useStore((s) => s.clearDemoData);
  const [word, setWord] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <section className="rounded-[24px] border-2 border-dashed border-danger/30 p-5 sm:p-6">
      <h2 className="font-display text-lg font-bold">{d.team.danger}</h2>
      <p className="mt-1 max-w-2xl text-sm text-ink-soft">{d.team.dangerText}</p>
      {done ? (
        <div className="mt-4"><Notice kind="success">{d.team.dangerDone}</Notice></div>
      ) : (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input value={word} onChange={(e) => setWord(e.target.value)} placeholder={d.team.dangerWord} aria-label={d.team.dangerConfirm} className="field sm:max-w-[200px]" />
          <button
            disabled={word.trim().toUpperCase() !== d.team.dangerWord || busy}
            onClick={async () => {
              setBusy(true);
              const res = await clearDemoData();
              setBusy(false);
              if (res.ok) setDone(true);
            }}
            className="h-11 rounded-full bg-danger px-5 text-sm font-bold text-white disabled:opacity-40"
          >
            {d.team.dangerButton}
          </button>
          <span className="text-xs text-ink-faint">{d.team.dangerConfirm}</span>
        </div>
      )}
    </section>
  );
}
