"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyRow, Notice, PageHeader, SearchInput, StatusBadge, Table } from "@/components/dashboard/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { can, canEditSale, saleTotal, visibleSales } from "@/lib/business";
import { today } from "@/lib/dates";
import { useCurrentUser, useStore } from "@/lib/store";
import type { SaleStatus } from "@/lib/types";

const STATUSES: SaleStatus[] = ["pending", "paid", "shipped"];
/** Flujo de una orden: pendiente → pagada → enviada. */
const NEXT_STATUS: Record<SaleStatus, SaleStatus | null> = { pending: "paid", paid: "shipped", shipped: null };

export default function SalesPage() {
  const { d, money, date, num } = useI18n();
  const user = useCurrentUser()!;
  const db = useStore((s) => s.db);
  const setSaleStatus = useStore((s) => s.setSaleStatus);
  const isOwner = can(user, "sales.filterBySeller");

  const [query, setQuery] = useState("");
  const [seller, setSeller] = useState("all");
  const [status, setStatus] = useState<"all" | SaleStatus>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const sellers = db.users.filter((u) => u.role === "seller");
  const clientName = (id: string) => db.clients.find((c) => c.id === id)?.company ?? "—";

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visibleSales(user, db.sales)
      .filter((s) => (seller === "all" || s.sellerId === seller) && (status === "all" || s.status === status))
      .filter((s) => (!from || s.date >= from) && (!to || s.date <= to))
      .filter((s) => !q || s.number.toLowerCase().includes(q) || clientName(s.clientId).toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [db.sales, db.clients, user, query, seller, status, from, to]);

  const total = rows.reduce((s, x) => s + saleTotal(x), 0);
  const head = [d.sales.number, d.common.date, d.sales.client, ...(isOwner ? [d.sales.seller] : []), d.sales.items, d.common.total, d.sales.status, d.sales.due];

  return (
    <>
      <PageHeader
        title={d.sales.title}
        subtitle={isOwner ? d.sales.subtitleOwner : d.sales.subtitleSeller}
        actions={<Link href="/dashboard/sales/new" className="btn btn-primary">+ {d.dash.newSale}</Link>}
      />

      {!isOwner && <div className="mb-4"><Notice>{d.sales.tunnel}</Notice></div>}

      <div className="card mb-4 grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_0.8fr_0.8fr]">
        <SearchInput value={query} onChange={setQuery} placeholder={`${d.sales.number} / ${d.sales.client}…`} />
        {isOwner && (
          <select aria-label={d.sales.seller} className="field" value={seller} onChange={(e) => setSeller(e.target.value)}>
            <option value="all">{d.sales.allSellers}</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
        <select aria-label={d.sales.status} className="field" value={status} onChange={(e) => setStatus(e.target.value as "all" | SaleStatus)}>
          <option value="all">{d.sales.allStatuses}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{d.sales.statuses[s]}</option>
          ))}
        </select>
        <label className="relative">
          <span className="absolute left-3 top-1 text-[0.6rem] font-bold uppercase text-ink-faint">{d.common.from}</span>
          <input type="date" className="field pt-4 text-sm" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="relative">
          <span className="absolute left-3 top-1 text-[0.6rem] font-bold uppercase text-ink-faint">{d.common.to}</span>
          <input type="date" className="field pt-4 text-sm" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
        </label>
      </div>

      <p className="mb-3 text-sm text-ink-soft">
        <span className="font-bold text-ink">{num(rows.length)}</span> {d.sales.count} · <span className="tabular font-bold text-ink">{money(total)}</span>
      </p>

      <Table head={head}>
        {rows.length === 0 && <EmptyRow colSpan={head.length} label={d.common.none} />}
        {rows.map((s) => {
          const overdue = s.status === "pending" && s.dueDate < today();
          return (
            <tr key={s.id} className="hover:bg-sky-soft/30">
              <td className="px-4 py-3 font-mono text-xs font-bold">{s.number}</td>
              <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{date(s.date)}</td>
              <td className="px-4 py-3 font-semibold">{clientName(s.clientId)}</td>
              {isOwner && <td className="px-4 py-3 text-ink-soft">{db.users.find((u) => u.id === s.sellerId)?.name}</td>}
              <td className="px-4 py-3 text-ink-soft">{s.items.reduce((n, it) => n + it.quantity, 0)} {d.common.units}</td>
              <td className="tabular px-4 py-3 font-bold">{money(saleTotal(s))}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <StatusBadge status={s.status} />
                  {canEditSale(user, s) && NEXT_STATUS[s.status] && (
                    <button
                      onClick={() => setSaleStatus(s.id, NEXT_STATUS[s.status]!)}
                      className="whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold text-sky-deep transition-colors hover:bg-sky-soft"
                    >
                      {s.status === "pending" ? d.sales.markPaid : d.sales.markShipped} →
                    </button>
                  )}
                </div>
              </td>
              <td className={`whitespace-nowrap px-4 py-3 text-xs ${overdue ? "font-bold text-danger" : "text-ink-faint"}`}>{date(s.dueDate)}</td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}
