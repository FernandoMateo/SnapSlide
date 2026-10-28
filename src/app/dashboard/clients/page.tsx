"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Drawer, EmptyRow, Notice, PageHeader, SearchInput, StatusBadge, Table } from "@/components/dashboard/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { can, clientAccount, saleTotal, visibleSales } from "@/lib/business";
import { daysBetween, today } from "@/lib/dates";
import { useCurrentUser, useStore } from "@/lib/store";
import type { Client } from "@/lib/types";

export default function ClientsPage() {
  const { d, money } = useI18n();
  const user = useCurrentUser()!;
  const db = useStore((s) => s.db);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Client | null>(null);
  const canEdit = can(user, "clients.edit");

  // Las métricas de cuenta se calculan solo sobre las ventas que este usuario puede ver.
  const sales = useMemo(() => visibleSales(user, db.sales), [user, db.sales]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return db.clients
      .filter((c) => !q || c.company.toLowerCase().includes(q) || c.contact.toLowerCase().includes(q))
      .map((c) => ({ c, acc: clientAccount(c, sales, db.payments) }))
      .sort((a, b) => Number(b.c.sellerId === user.id) - Number(a.c.sellerId === user.id) || b.acc.lifetimeValue - a.acc.lifetimeValue);
  }, [db.clients, db.payments, sales, query, user.id]);

  const open = db.clients.find((c) => c.id === openId);

  return (
    <>
      <PageHeader
        title={d.clients.title}
        subtitle={d.clients.subtitle}
        actions={
          canEdit && (
            <button
              onClick={() => setEditing({ id: "", company: "", contact: "", phone: "", email: "", address: "", city: "Miami", zip: "", sellerId: db.users.find((u) => u.role === "seller")!.id, paymentTerms: 30, createdAt: today() })}
              className="btn btn-primary"
            >
              + {d.clients.newClient}
            </button>
          )
        }
      />
      <div className="mb-5">
        <SearchInput value={query} onChange={setQuery} placeholder={d.clients.searchPh} />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map(({ c, acc }, i) => (
          <motion.button
            key={c.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 10) * 0.035, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => setOpenId(c.id)}
            className="card group p-5 text-left transition-[border-color,transform] hover:-translate-y-0.5 hover:border-sky"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                <span className="block truncate font-display text-lg font-bold tracking-tight">{c.company}</span>
                <span className="block truncate text-sm text-ink-soft">{c.contact} · {c.city}</span>
              </span>
              {c.sellerId === user.id && <span className="shrink-0 rounded-full bg-sky-soft px-2 py-0.5 text-[0.65rem] font-extrabold text-sky-deep">★</span>}
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[0.65rem] font-bold uppercase tracking-wider text-ink-faint">CLV</dt>
                <dd className="tabular font-display text-xl font-extrabold">{money(acc.lifetimeValue)}</dd>
              </div>
              <div>
                <dt className="text-[0.65rem] font-bold uppercase tracking-wider text-ink-faint">{d.clients.pendingTotal}</dt>
                <dd className={`tabular font-display text-xl font-extrabold ${acc.overdueTotal > 0 ? "text-danger" : ""}`}>{money(acc.pendingTotal)}</dd>
              </div>
            </dl>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-sky-deep opacity-70 transition-opacity group-hover:opacity-100">
              {d.clients.statement} →
            </span>
          </motion.button>
        ))}
      </div>

      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open?.company ?? ""} wide>
        {open && <ClientStatement client={open} onEdit={canEdit ? () => { setEditing(open); setOpenId(null); } : undefined} />}
      </Drawer>

      <Drawer open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? editing.company : d.clients.newClient}>
        {editing && <ClientForm initial={editing} onDone={() => setEditing(null)} />}
      </Drawer>
    </>
  );
}

function ClientStatement({ client, onEdit }: { client: Client; onEdit?: () => void }) {
  const { d, money, date } = useI18n();
  const user = useCurrentUser()!;
  const db = useStore((s) => s.db);
  const acc = clientAccount(client, visibleSales(user, db.sales), db.payments);
  const seller = db.users.find((u) => u.id === client.sellerId);
  const t = today();

  return (
    <div className="grid gap-6">
      <section className="grid gap-1 text-sm text-ink-soft">
        <p><span className="font-bold text-ink">{client.contact}</span> · {client.phone} · <a className="text-sky-deep hover:underline" href={`mailto:${client.email}`}>{client.email}</a></p>
        <p>{client.address}, {client.city}, FL {client.zip}</p>
        <p>{d.clients.seller}: <span className="font-semibold text-ink">{seller?.name}</span> · {d.clients.terms}: {client.paymentTerms}</p>
        {onEdit && <button onClick={onEdit} className="btn btn-ghost mt-2 h-9 justify-self-start text-sm">{d.common.edit}</button>}
      </section>

      {user.role === "seller" && <Notice>{d.clients.yourOrdersOnly}</Notice>}

      <section className="grid gap-3 sm:grid-cols-[1.3fr_1fr_1fr]">
        <div className="rounded-2xl bg-ink p-5 text-white">
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-white/60">{d.clients.clv}</p>
          <p className="tabular mt-2 font-display text-3xl font-extrabold">{money(acc.lifetimeValue)}</p>
          <p className="mt-1 text-xs text-white/60">{d.clients.clvHint} · {acc.orders.length} {d.clients.orders.toLowerCase()}</p>
        </div>
        <div className="rounded-2xl bg-sky-soft p-5">
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-sky-deep">{d.clients.avgPay}</p>
          <p className="tabular mt-2 font-display text-3xl font-extrabold">{Math.round(acc.avgDaysToPay)}<span className="ml-1 text-base font-bold text-ink-faint">{d.common.days}</span></p>
          <p className="mt-1 text-xs text-ink-soft">{d.clients.terms}: {client.paymentTerms}</p>
        </div>
        <div className={`rounded-2xl p-5 ${acc.overdueTotal ? "bg-danger/10" : "bg-mist"}`}>
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-ink-faint">{d.clients.pendingTotal}</p>
          <p className="tabular mt-2 font-display text-3xl font-extrabold">{money(acc.pendingTotal)}</p>
          {acc.overdueTotal > 0 && <p className="mt-1 text-xs font-bold text-danger">{money(acc.overdueTotal)} {d.clients.overdue}</p>}
        </div>
      </section>

      <section>
        <h3 className="label">{d.clients.invoicesPending}</h3>
        <Table head={[d.sales.number, d.common.date, d.sales.due, d.common.total, d.sales.status]}>
          {acc.pending.length === 0 && <EmptyRow colSpan={5} label={d.common.none} />}
          {acc.pending.map((s) => {
            const late = daysBetween(s.dueDate, t);
            return (
              <tr key={s.id}>
                <td className="px-4 py-3 font-mono text-xs font-bold">{s.number}</td>
                <td className="px-4 py-3 text-ink-soft">{date(s.date)}</td>
                <td className={`px-4 py-3 ${late > 0 ? "font-bold text-danger" : "text-ink-soft"}`}>
                  {date(s.dueDate)}
                  {late > 0 && <span className="block text-xs">{late} {d.clients.overdueDays}</span>}
                </td>
                <td className="tabular px-4 py-3 font-bold">{money(saleTotal(s))}</td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
              </tr>
            );
          })}
        </Table>
      </section>

      <section>
        <h3 className="label">{d.clients.paymentsDone}</h3>
        <Table head={[d.common.date, d.sales.number, d.clients.method, d.common.total, d.common.days]}>
          {acc.payments.length === 0 && <EmptyRow colSpan={5} label={d.common.none} />}
          {acc.payments.map((p) => {
            const sale = db.sales.find((s) => s.id === p.saleId);
            return (
              <tr key={p.id}>
                <td className="px-4 py-3 text-ink-soft">{date(p.date)}</td>
                <td className="px-4 py-3 font-mono text-xs font-bold">{sale?.number}</td>
                <td className="px-4 py-3">{d.clients.methods[p.method]}</td>
                <td className="tabular px-4 py-3 font-bold text-ok">{money(p.amount)}</td>
                <td className="tabular px-4 py-3 text-ink-soft">{sale ? daysBetween(sale.date, p.date) : "—"}</td>
              </tr>
            );
          })}
        </Table>
      </section>
    </div>
  );
}

function ClientForm({ initial, onDone }: { initial: Client; onDone: () => void }) {
  const { d, t } = useI18n();
  const saveClient = useStore((s) => s.saveClient);
  const users = useStore((s) => s.db.users);
  const sellers = users.filter((u) => u.role === "seller");
  const [c, setC] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Client>(k: K, v: Client[K]) => setC((p) => ({ ...p, [k]: v }));

  const field = (k: "company" | "contact" | "phone" | "email" | "address" | "city" | "zip", label: string, type = "text", span = false) => (
    <div className={span ? "sm:col-span-2" : ""}>
      <label className="label" htmlFor={`c-${k}`}>{label}</label>
      <input id={`c-${k}`} type={type} required={k !== "zip"} className="field" value={c[k]} onChange={(e) => set(k, e.target.value)} />
    </div>
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const res = saveClient(c);
        if (res.ok) onDone();
        else setError(t(res.error));
      }}
      className="grid gap-4 sm:grid-cols-2"
    >
      {field("company", d.clients.company, "text", true)}
      {field("contact", d.clients.contact)}
      {field("phone", d.clients.phone, "tel")}
      {field("email", d.clients.email, "email", true)}
      {field("address", d.clients.address, "text", true)}
      {field("city", d.clients.city)}
      {field("zip", d.clients.zip)}
      <div>
        <label className="label" htmlFor="c-seller">{d.clients.seller}</label>
        <select id="c-seller" className="field" value={c.sellerId} onChange={(e) => set("sellerId", e.target.value)}>
          {sellers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="c-terms">{d.clients.terms}</label>
        <input id="c-terms" type="number" min={0} className="field tabular" value={c.paymentTerms} onChange={(e) => set("paymentTerms", Number(e.target.value))} />
      </div>
      {error && <div className="sm:col-span-2"><Notice kind="error">{error}</Notice></div>}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <button type="button" onClick={onDone} className="btn btn-ghost">{d.common.cancel}</button>
        <button type="submit" className="btn btn-primary">{d.common.save}</button>
      </div>
    </form>
  );
}
