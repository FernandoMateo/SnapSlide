"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { EmptyRow, Notice, PageHeader, Table } from "@/components/dashboard/ui";
import { LabelDialog, type LabelData } from "@/components/inventory/LotLabel";
import { labelFor } from "@/components/inventory/labelFor";
import { ScanBox } from "@/components/inventory/ScanBox";
import { useI18n } from "@/i18n/I18nProvider";
import { can, lotsFEFO, productStock, stockLevel } from "@/lib/business";
import { daysBetween, today } from "@/lib/dates";
import { useCurrentUser, useStore } from "@/lib/store";
import type { MovementReason, Product } from "@/lib/types";


export default function InventoryPage() {
  const { d } = useI18n();
  const user = useCurrentUser()!;
  const products = useStore((s) => s.db.products);
  const [label, setLabel] = useState<LabelData | null>(null);

  if (!can(user, "inventory.manage")) return <Notice kind="error">{d.perm.denied}</Notice>;

  // Lo más urgente primero
  const rank = { out: 0, critical: 1, low: 2, ok: 3 };
  const sorted = [...products].sort((a, b) => rank[stockLevel(a)] - rank[stockLevel(b)]);

  return (
    <>
      <PageHeader title={d.inventory.title} subtitle={d.inventory.subtitle} />

      <ScanBox onLabel={setLabel} />

      <h2 className="label">{d.inventory.monitor}</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((p, i) => (
          <StockTile key={p.id} product={p} index={i} />
        ))}
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <MovementForm type="in" onLabel={setLabel} />
        <MovementForm type="out" onLabel={setLabel} />
      </div>

      <MovementHistory onLabel={setLabel} />
      <LabelDialog data={label} onClose={() => setLabel(null)} />
    </>
  );
}

function StockTile({ product, index }: { product: Product; index: number }) {
  const { d, num } = useI18n();
  const stock = productStock(product);
  const level = stockLevel(product);
  const pct = Math.min(100, (stock / (product.minStock * 2)) * 100);
  const minPct = 50; // el mínimo se dibuja a mitad de la barra (escala = 2× mínimo)
  const style = {
    out: "border-danger pulse-danger",
    critical: "border-danger/60 pulse-danger",
    low: "border-warn/60 pulse-warn",
    ok: "border-line",
  }[level];
  const bar = { out: "bg-danger", critical: "bg-danger", low: "bg-warn", ok: "bg-sky" }[level];
  const soonest = lotsFEFO(product)[0];
  const expDays = soonest ? daysBetween(today(), soonest.expiresAt) : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-[22px] border-2 bg-white p-5 ${style}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold">{product.name}</p>
          <p className="font-mono text-xs text-ink-faint">{product.sku}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-extrabold uppercase tracking-wider ${level === "ok" ? "bg-ok/12 text-[#0a7d5c]" : level === "low" ? "bg-warn/15 text-[#b86b00]" : "bg-danger text-white"}`}>
          {d.inventory.levels[level]}
        </span>
      </div>
      <p className="tabular mt-4 font-display text-4xl font-extrabold tracking-tight">
        {num(stock)} <span className="text-sm font-semibold text-ink-faint">{d.common.units}</span>
      </p>
      <div className="relative mt-3 h-2.5 rounded-full bg-mist">
        <motion.div className={`h-full rounded-full ${bar}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} />
        <span className="absolute -top-1 h-4.5 w-0.5 rounded bg-ink/40" style={{ left: `${minPct}%` }} title={d.products.minStock} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-ink-faint">
        <span>
          {d.inventory.of} {num(product.minStock)}
        </span>
        {soonest && (
          <span className={expDays !== null && expDays <= 45 ? "font-bold text-[#b86b00]" : ""}>
            {soonest.code} · {expDays} {d.common.days}
          </span>
        )}
      </div>
    </motion.article>
  );
}

const IN_REASONS: MovementReason[] = ["production", "purchase", "adjustment"];
const OUT_REASONS: MovementReason[] = ["waste", "damage", "expired", "adjustment"];

function MovementForm({ type, onLabel }: { type: "in" | "out"; onLabel: (l: LabelData) => void }) {
  const { d, t, num, date } = useI18n();
  const db = useStore((s) => s.db);
  const me = useCurrentUser()!;
  const products = db.products;
  const [printable, setPrintable] = useState<LabelData | null>(null);
  const recordMovement = useStore((s) => s.recordMovement);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [lotCode, setLotCode] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [reason, setReason] = useState<MovementReason>(type === "in" ? "production" : "waste");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const product = products.find((p) => p.id === productId);
  const lots = product ? lotsFEFO(product) : [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = type === "out" ? lotCode || lots[0]?.code || "" : lotCode.trim().toUpperCase();
    const res = await recordMovement({ productId, type, reason, quantity: Number(quantity), lotCode: code, expiresAt: expiresAt || undefined, note: note || undefined });
    if (res.ok) {
      setMsg({ kind: "success", text: d.inventory.done });
      if (type === "in") {
        // Etiqueta con lo recién ingresado (el lote ya existe con su vencimiento).
        const fresh = useStore.getState().db;
        const data = labelFor(fresh, { productId, lotCode: code, quantity: Number(quantity), date: today(), reason, userId: me.id, note: note || undefined }, d.inventory.reasons[reason]);
        setPrintable(data);
        if (data) onLabel(data);
      }
      setQuantity("");
      setNote("");
      if (type === "in") setLotCode("");
    } else setMsg({ kind: "error", text: t(res.error) });
  };

  const existingLot = type === "in" && product?.lots.find((l) => l.code === lotCode.trim().toUpperCase());

  return (
    <form onSubmit={submit} className={`card grid gap-4 p-6 ${type === "in" ? "" : "lg:mt-10"}`}>
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-full text-lg font-extrabold ${type === "in" ? "bg-ok/12 text-ok" : "bg-danger/10 text-danger"}`}>{type === "in" ? "↓" : "↑"}</span>
        <h2 className="font-display text-xl font-bold tracking-tight">{type === "in" ? d.inventory.inTitle : d.inventory.outTitle}</h2>
      </div>
      {type === "out" && <p className="-mt-2 text-sm text-ink-soft">{d.inventory.outHint}</p>}

      <div>
        <label className="label" htmlFor={`${type}-product`}>{d.inventory.product}</label>
        <select id={`${type}-product`} className="field" value={productId} onChange={(e) => { setProductId(e.target.value); setLotCode(""); }}>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name} · {p.sku}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`${type}-lot`}>{d.inventory.lot}</label>
          {type === "out" ? (
            <select id={`${type}-lot`} className="field font-mono text-sm" value={lotCode || lots[0]?.code || ""} onChange={(e) => setLotCode(e.target.value)}>
              {lots.map((l) => (
                <option key={l.id} value={l.code}>{l.code} · {num(l.quantity)} · {date(l.expiresAt)}</option>
              ))}
            </select>
          ) : (
            <input id={`${type}-lot`} required list={`${type}-lots`} placeholder={d.inventory.newLot} className="field font-mono text-sm uppercase placeholder:normal-case" value={lotCode} onChange={(e) => setLotCode(e.target.value)} />
          )}
          <datalist id={`${type}-lots`}>
            {product?.lots.map((l) => <option key={l.id} value={l.code} />)}
          </datalist>
        </div>
        <div>
          <label className="label" htmlFor={`${type}-qty`}>{d.common.quantity}</label>
          <input id={`${type}-qty`} type="number" min={1} required inputMode="numeric" className="field tabular" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        {type === "in" && !existingLot && (
          <div>
            <label className="label" htmlFor="in-exp">{d.products.expiresAt}</label>
            <input id="in-exp" type="date" required className="field" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
        )}
        <div>
          <label className="label" htmlFor={`${type}-reason`}>{d.inventory.reason}</label>
          <select id={`${type}-reason`} className="field" value={reason} onChange={(e) => setReason(e.target.value as MovementReason)}>
            {(type === "in" ? IN_REASONS : OUT_REASONS).map((r) => (
              <option key={r} value={r}>{d.inventory.reasons[r]}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor={`${type}-note`}>{d.inventory.note}</label>
        <input id={`${type}-note`} className="field" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <AnimatePresence>{msg && <Notice kind={msg.kind}>{msg.text}</Notice>}</AnimatePresence>
      {type === "in" && printable && msg?.kind === "success" && (
        <button type="button" onClick={() => onLabel(printable)} className="btn btn-ghost -mt-1 h-11 text-sm">
          🏷 {d.inventory.printLabel} · {printable.lotCode}
        </button>
      )}

      <button type="submit" disabled={type === "out" && lots.length === 0} className={`btn ${type === "in" ? "btn-primary" : "btn-dark"}`}>
        {d.inventory.register} · {type === "in" ? d.inventory.movementIn : d.inventory.movementOut}
      </button>
    </form>
  );
}

function MovementHistory({ onLabel }: { onLabel: (l: LabelData) => void }) {
  const { d, num, date } = useI18n();
  const db = useStore((s) => s.db);
  const { movements, products, users } = db;
  const recent = movements.slice(0, 15);
  return (
    <section className="mt-10">
      <h2 className="label">{d.inventory.history}</h2>
      <Table head={[d.common.date, d.inventory.product, d.inventory.lot, d.inventory.reason, d.common.quantity, d.inventory.user, d.inventory.label]}>
        {recent.length === 0 && <EmptyRow colSpan={7} label={d.common.none} />}
        {recent.map((m) => (
          <tr key={m.id}>
            <td className="px-4 py-3 text-ink-soft">{date(m.date)}</td>
            <td className="px-4 py-3 font-semibold">{products.find((p) => p.id === m.productId)?.name}</td>
            <td className="px-4 py-3 font-mono text-xs">{m.lotCode}</td>
            <td className="px-4 py-3">{d.inventory.reasons[m.reason]}</td>
            <td className={`tabular px-4 py-3 font-bold ${m.type === "in" ? "text-ok" : "text-danger"}`}>
              {m.type === "in" ? "+" : "−"}
              {num(m.quantity)}
            </td>
            <td className="px-4 py-3 text-ink-soft">{users.find((u) => u.id === m.userId)?.name}</td>
            <td className="px-4 py-3">
              {m.type === "in" && (
                <button
                  onClick={() => {
                    const data = labelFor(db, m, d.inventory.reasons[m.reason]);
                    if (data) onLabel(data);
                  }}
                  className="rounded-full bg-sky-soft px-3 py-1.5 text-xs font-bold text-sky-deep hover:bg-sky hover:text-white"
                >
                  🏷 {d.inventory.label}
                </button>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </section>
  );
}
