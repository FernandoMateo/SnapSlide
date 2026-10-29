"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";
import { GoalRing, SmoothLineChart, Sparkline } from "@/components/dashboard/charts";
import { PageHeader, Segmented, StatusBadge } from "@/components/dashboard/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { cashFlowProjection, criticalAlerts, dailySeries, financials, saleTotal, salesInMonth, sellerMonthStats, visibleSales, type CriticalAlert } from "@/lib/business";
import { addDays, today } from "@/lib/dates";
import { useCurrentUser, useStore } from "@/lib/store";
import type { User } from "@/lib/types";

const rise = (i: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: i * 0.06 },
});

export default function DashboardHome() {
  const user = useCurrentUser();
  if (!user) return null;
  return user.role === "owner" ? <OwnerHome /> : <SellerHome user={user} />;
}

/* ───────────────────────── OWNER ───────────────────────── */

type Period = "30" | "90" | "all";

function OwnerHome() {
  const { d, money, date, num } = useI18n();
  const db = useStore((s) => s.db);
  const [period, setPeriod] = useState<Period>("30");
  const [horizon, setHorizon] = useState<30 | 60 | 90>(90);

  const range = period === "all" ? {} : { from: addDays(today(), -Number(period) + 1), to: today() };
  const fin = financials(db.payments, db.expenses, range);
  const days = period === "all" ? 150 : Number(period);
  const series = useMemo(() => dailySeries(db.payments, db.expenses, days), [db.payments, db.expenses, days]);
  // Acumulado semanal para que la sparkline no sea ruido diario
  const weekly = (key: "income" | "expenses") => {
    const out: number[] = [];
    for (let i = 0; i < series.length; i += 7) out.push(series.slice(i, i + 7).reduce((s, p) => s + p[key], 0));
    return out;
  };

  const projection = useMemo(() => cashFlowProjection(db.sales, db.payments, db.expenses, db.clients), [db]);
  // Un punto cada 3 días: curva suave sin perder la tendencia.
  const STEP = 3;
  const chartData = projection
    .slice(0, horizon + 1)
    .filter((p) => p.day % STEP === 0)
    .map((p) => ({ label: date(p.date, { day: "2-digit", month: "short" }), value: p.balance }));
  const markers = [0, 30, 60, 90].filter((m) => m <= horizon).map((m) => ({ index: m / STEP, label: m === 0 ? d.home.today : `${m}d` }));
  const end = projection[horizon];

  const alerts = useMemo(() => criticalAlerts(db.products, db.sales, db.clients), [db.products, db.sales, db.clients]);

  const sellers = db.users.filter((u) => u.role === "seller");
  const ranking = sellers
    .map((s) => ({ s, stats: sellerMonthStats(s, db.sales) }))
    .sort((a, b) => b.stats.total - a.stats.total);
  const monthTotal = salesInMonth(db.sales).reduce((s, x) => s + saleTotal(x), 0);

  return (
    <>
      <PageHeader
        title={d.home.ownerTitle}
        subtitle={`${num(salesInMonth(db.sales).length)} ${d.home.orders} · ${money(monthTotal)} ${d.sales.title.toLowerCase()} ${date(today(), { month: "long" })}`}
        actions={
          <Segmented<Period>
            value={period}
            onChange={setPeriod}
            options={[
              { value: "30", label: d.home.periods["30"] },
              { value: "90", label: d.home.periods["90"] },
              { value: "all", label: d.home.periods.all },
            ]}
          />
        }
      />

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Ingresos: la tarjeta protagonista */}
        <motion.section {...rise(0)} className="relative overflow-hidden rounded-[24px] p-7 text-white shadow-[0_30px_60px_-30px_rgba(0,120,190,0.8)] lg:col-span-7 lg:row-span-2 lg:p-9" style={{ background: "linear-gradient(135deg, #035e94 0%, #0096d6 55%, #3fd0ff 100%)" }}>
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-10 h-72 w-72 rounded-full bg-[#03101f]/25 blur-3xl" />
          <p className="label relative !text-white/70">{d.home.income}</p>
          <p className="tabular relative mt-3 font-display text-[clamp(2.8rem,6vw,5.2rem)] font-extrabold leading-none tracking-[-0.04em]">{money(fin.income)}</p>
          <p className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm ring-1 ring-white/25 backdrop-blur">
            <span className="font-bold">{Math.round(fin.margin * 100)}%</span> {d.home.margin}
          </p>
          <Sparkline values={weekly("income")} color="#ffffff" className="relative mt-10 h-28 w-full lg:h-40" />
        </motion.section>

        <motion.section {...rise(1)} className="card p-7 lg:col-span-5">
          <p className="label">{d.home.expenses}</p>
          <p className="tabular mt-3 font-display text-4xl font-extrabold tracking-[-0.03em]">{money(fin.expenses)}</p>
          <Sparkline values={weekly("expenses")} color="#FF9F1C" className="mt-5 h-12 w-full" />
        </motion.section>

        <motion.section {...rise(2)} className="relative overflow-hidden rounded-[24px] p-7 text-white lg:col-span-5" style={{ background: "linear-gradient(160deg, #06203a 0%, #04121f 100%)" }}>
          <div className="pointer-events-none absolute -bottom-16 -right-10 h-48 w-48 rounded-full bg-sky/40 blur-3xl" />
          <p className="label !text-white/60">{d.home.net}</p>
          <p className={`tabular mt-3 font-display text-4xl font-extrabold tracking-[-0.03em] ${fin.net < 0 ? "text-danger" : "text-white"}`}>{money(fin.net)}</p>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-[#0096d6] to-[#3fd0ff]" initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, fin.margin * 100))}%` }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} />
          </div>
        </motion.section>

        {/* Flujo de caja proyectado */}
        <motion.section {...rise(3)} className="card p-6 lg:col-span-8 lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight">{d.home.cashflow}</h2>
              <p className="mt-1 max-w-md text-sm text-ink-soft">{d.home.cashflowHint}</p>
            </div>
            <Segmented<"30" | "60" | "90">
              value={String(horizon) as "30" | "60" | "90"}
              onChange={(v) => setHorizon(Number(v) as 30 | 60 | 90)}
              options={[
                { value: "30", label: "30d" },
                { value: "60", label: "60d" },
                { value: "90", label: "90d" },
              ]}
            />
          </div>
          <p className="tabular mt-5 font-display text-3xl font-extrabold tracking-tight">
            {money(end.balance)} <span className="text-sm font-semibold text-ink-faint">· {date(end.date)}</span>
          </p>
          <div className="mt-4">
            <SmoothLineChart key={horizon} data={chartData} markers={markers} format={(n) => money(n)} />
          </div>
        </motion.section>

        {/* Alertas críticas */}
        <motion.section {...rise(4)} className="card flex flex-col p-6 lg:col-span-4 lg:max-h-[470px]">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold tracking-tight">{d.home.alerts}</h2>
            <span className={`grid h-7 min-w-7 place-items-center rounded-full px-2 text-xs font-extrabold ${alerts.length ? "bg-danger text-white" : "bg-ok/15 text-ok"}`}>{alerts.length}</span>
          </div>
          <ul className="-mx-2 mt-4 flex-1 space-y-2 overflow-y-auto px-2 pb-1">
            {alerts.length === 0 && <li className="py-10 text-center text-sm text-ink-faint">{d.home.noAlerts}</li>}
            {alerts.map((a) => (
              <AlertItem key={a.id} alert={a} />
            ))}
          </ul>
        </motion.section>

        {/* Ranking de vendedores */}
        <motion.section {...rise(5)} className="card p-6 lg:col-span-12 lg:p-8">
          <h2 className="font-display text-xl font-bold tracking-tight">{d.home.topSellers}</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {ranking.map(({ s, stats }, i) => (
              <div key={s.id} className={`rounded-2xl p-5 ${i === 0 ? "bg-gradient-to-br from-[#e6f8ff] to-[#d3f1ff] ring-1 ring-sky/30" : "bg-[#f2f7fb]"}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-3 font-bold">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-sm font-extrabold ${i === 0 ? "bg-gradient-to-br from-[#035e94] to-[#3fd0ff] text-white" : "bg-white text-ink-soft ring-1 ring-line"}`}>{i + 1}</span>
                    <span className="truncate">{s.name}</span>
                  </span>
                  <span className="text-xs font-bold text-ink-faint">{num(stats.orders)} {d.home.orders}</span>
                </div>
                <p className="tabular mt-3 font-display text-2xl font-extrabold">{money(stats.total)}</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
                  <motion.div className={`h-full rounded-full ${stats.progress >= 1 ? "bg-ok" : "bg-sky"}`} initial={{ width: 0 }} animate={{ width: `${Math.min(100, stats.progress * 100)}%` }} transition={{ duration: 1, delay: 0.3 + i * 0.1 }} />
                </div>
                <p className="mt-2 text-xs text-ink-soft">
                  {Math.round(stats.progress * 100)}% {d.home.goalOf} {money(stats.goal)} · {d.home.commission.toLowerCase()} {money(stats.commission)}
                </p>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </>
  );
}

function AlertItem({ alert }: { alert: CriticalAlert }) {
  const { d, money, num } = useI18n();
  const severe = alert.kind === "out" || alert.kind === "critical";
  const tone = severe ? "border-danger/50 bg-danger/5 pulse-danger" : alert.kind === "overdue" ? "border-warn/40 bg-warn/5" : "border-warn/40 bg-warn/5 pulse-warn";
  const href = alert.productId ? "/dashboard/inventory" : "/dashboard/clients";
  const value =
    alert.kind === "expiring" ? `${alert.value} ${d.common.days}` : alert.kind === "overdue" ? money(alert.value) : `${num(alert.value)} ${d.common.units}`;
  return (
    <li>
      <Link href={href} className={`block rounded-2xl border px-4 py-3 transition-transform hover:-translate-y-px ${tone}`}>
        <span className={`text-[0.65rem] font-extrabold uppercase tracking-[0.12em] ${severe ? "text-danger" : "text-[#b86b00]"}`}>{d.home.alertKinds[alert.kind]}</span>
        <span className="mt-0.5 flex items-baseline justify-between gap-3">
          <span className="truncate text-sm font-bold text-ink">{alert.title}</span>
          <span className="tabular shrink-0 text-sm font-bold text-ink-soft">{value}</span>
        </span>
      </Link>
    </li>
  );
}

/* ───────────────────────── VENDEDOR ───────────────────────── */

function SellerHome({ user }: { user: User }) {
  const { d, money, date, num } = useI18n();
  const db = useStore((s) => s.db);
  const stats = sellerMonthStats(user, db.sales);
  const mine = visibleSales(user, db.sales);
  const recent = [...mine].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  const dayOfMonth = Number(today().slice(8, 10));
  const daily = Array.from({ length: dayOfMonth }, (_, i) => {
    const iso = `${today().slice(0, 8)}${String(i + 1).padStart(2, "0")}`;
    return mine.filter((s) => s.date === iso).reduce((sum, s) => sum + saleTotal(s), 0);
  });
  const cumulative = daily.reduce<number[]>((acc, v) => [...acc, (acc.at(-1) ?? 0) + v], []);

  return (
    <>
      <PageHeader title={d.home.sellerTitle} subtitle={`${d.dash.greeting}, ${user.name.split(" ")[0]} · ${date(today(), { month: "long", year: "numeric" })}`} />

      <div className="grid gap-4 lg:grid-cols-12">
        <motion.section {...rise(0)} className="card flex flex-col items-center justify-center p-8 lg:col-span-5 lg:row-span-2">
          <p className="label self-start">{d.home.goal}</p>
          <div className="my-6">
            <GoalRing progress={stats.progress} size={240}>
              <div>
                <p className="tabular font-display text-5xl font-extrabold tracking-tight">{Math.round(stats.progress * 100)}%</p>
                <p className="mt-1 text-xs font-semibold text-ink-faint">
                  {d.home.goalOf} {money(stats.goal)}
                </p>
              </div>
            </GoalRing>
          </div>
          <p className={`text-sm font-semibold ${stats.progress >= 1 ? "text-ok" : "text-ink-soft"}`}>
            {stats.progress >= 1 ? d.home.goalReached : `${money(stats.goal - stats.total)} ${d.home.goalRemaining}`}
          </p>
        </motion.section>

        <motion.section {...rise(1)} className="card relative overflow-hidden p-7 lg:col-span-7">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-sky/15 blur-3xl" />
          <p className="label">{d.home.monthSales}</p>
          <p className="tabular mt-3 font-display text-[clamp(2.6rem,5vw,4.4rem)] font-extrabold leading-none tracking-[-0.04em]">{money(stats.total)}</p>
          <p className="mt-2 text-sm text-ink-soft">
            {num(stats.orders)} {d.home.orders}
          </p>
          <Sparkline values={cumulative.length > 1 ? cumulative : [0, 0]} className="mt-6 h-20 w-full" />
        </motion.section>

        <motion.section {...rise(2)} className="relative overflow-hidden rounded-[24px] p-7 text-white lg:col-span-7" style={{ background: "linear-gradient(135deg, #035e94 0%, #0096d6 55%, #3fd0ff 100%)" }}>
          <div className="pointer-events-none absolute -bottom-16 -right-10 h-48 w-48 rounded-full bg-sky/40 blur-3xl" />
          <p className="label !text-white/60">{d.home.commission}</p>
          <p className="tabular mt-3 font-display text-4xl font-extrabold tracking-tight">{money(stats.commission)}</p>
          <p className="mt-2 text-sm text-white/70">
            {money(stats.commissionCollected)} {d.home.commissionCollected} · {Math.round((user.commissionRate ?? 0) * 1000) / 10}%
          </p>
        </motion.section>

        <motion.section {...rise(3)} className="card p-6 lg:col-span-12">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold tracking-tight">{d.home.recentSales}</h2>
            <Link href="/dashboard/sales/new" className="btn btn-primary h-10 text-sm">+ {d.dash.newSale}</Link>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {recent.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{db.clients.find((c) => c.id === s.clientId)?.company}</span>
                  <span className="block text-xs text-ink-faint">{s.number} · {date(s.date)}</span>
                </span>
                <span className="flex items-center gap-3">
                  <StatusBadge status={s.status} />
                  <span className="tabular w-24 text-right text-sm font-bold">{money(saleTotal(s))}</span>
                </span>
              </li>
            ))}
          </ul>
        </motion.section>
      </div>
    </>
  );
}
