"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Notice, PageHeader, Segmented } from "@/components/dashboard/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { productStock } from "@/lib/business";
import { useCurrentUser, useStore } from "@/lib/store";
import type { ProductType, SaleItem } from "@/lib/types";

export default function NewSalePage() {
  const { d, t, money, num } = useI18n();
  const user = useCurrentUser()!;
  const { clients, products } = useStore((s) => s.db);
  const createSale = useStore((s) => s.createSale);

  // El vendedor ve primero su cartera
  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => Number(b.sellerId === user.id) - Number(a.sellerId === user.id) || a.company.localeCompare(b.company)),
    [clients, user.id],
  );

  const [clientId, setClientId] = useState("");
  const [filter, setFilter] = useState<"all" | ProductType>("all");
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);

  const client = clients.find((c) => c.id === clientId);
  const total = cart.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const inCart = (id: string) => cart.find((it) => it.productId === id)?.quantity ?? 0;

  const setQty = (productId: string, qty: number) => {
    const p = products.find((x) => x.id === productId)!;
    const q = Math.max(0, Math.min(productStock(p), Math.floor(qty) || 0));
    setCart((prev) => {
      const rest = prev.filter((it) => it.productId !== productId);
      return q === 0 ? rest : [...rest, { productId, quantity: q, unitPrice: p.price }].sort((a, b) => a.productId.localeCompare(b.productId));
    });
  };

  const confirm = async () => {
    setError(null);
    if (!clientId) return setError(d.sales.noClient);
    const res = await createSale({ clientId, items: cart, notes: notes || undefined });
    if (res.ok) {
      setCreated(res.id ?? "");
      setCart([]);
      setNotes("");
    } else setError(t(res.error));
  };

  if (created) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="card mx-auto mt-10 max-w-lg p-10 text-center">
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.45 }} className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sky text-white shadow-[var(--shadow-glow)]">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
        </motion.span>
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-ink-faint">{d.sales.created}</p>
        <p className="mt-2 font-display text-4xl font-extrabold">{created}</p>
        <div className="mt-8 flex justify-center gap-2">
          <button onClick={() => setCreated(null)} className="btn btn-ghost">+ {d.dash.newSale}</button>
          <Link href="/dashboard/sales" className="btn btn-primary">{d.sales.title}</Link>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <PageHeader title={d.sales.newTitle} subtitle={d.sales.newSubtitle} />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="grid gap-6">
          <section className="card p-5">
            <label className="label" htmlFor="client">{d.sales.client}</label>
            <select id="client" className="field" value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">{d.sales.selectClient}</option>
              {sortedClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company} {c.sellerId === user.id ? "★" : ""}
                </option>
              ))}
            </select>
            {client && (
              <p className="mt-3 text-sm text-ink-soft">
                {client.contact} · {client.address}, {client.city} · {d.sales.terms}: {client.paymentTerms} {d.common.days}
              </p>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="label !mb-0">{d.sales.items}</h2>
              <Segmented
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "all", label: d.products.typeAll },
                  { value: "sheet", label: d.products.sheet },
                  { value: "liquid", label: d.products.liquid },
                ]}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {products
                .filter((p) => filter === "all" || p.type === filter)
                .map((p) => {
                  const stock = productStock(p);
                  const qty = inCart(p.id);
                  return (
                    <article key={p.id} className={`card flex flex-col p-4 transition-shadow ${qty ? "ring-2 ring-sky" : ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold leading-tight">{p.name}</p>
                        <span className="tabular shrink-0 font-display font-extrabold text-sky-deep">{money(p.price)}</span>
                      </div>
                      <p className="mt-1 text-xs text-ink-faint">{p.presentation} · {p.sku}</p>
                      <p className={`mt-3 text-xs font-bold ${stock === 0 ? "text-danger" : "text-ink-soft"}`}>
                        {num(stock)} {d.sales.available}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <button type="button" aria-label="−" disabled={!qty} onClick={() => setQty(p.id, qty - 1)} className="grid h-10 w-10 place-items-center rounded-xl bg-mist text-lg font-bold disabled:opacity-40">−</button>
                        <input
                          aria-label={`${d.common.quantity} ${p.name}`}
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={stock}
                          value={qty || ""}
                          placeholder="0"
                          onChange={(e) => setQty(p.id, Number(e.target.value))}
                          className="field tabular h-10 min-h-0 flex-1 text-center"
                        />
                        <button type="button" aria-label="+" disabled={qty >= stock} onClick={() => setQty(p.id, qty + 10)} className="grid h-10 shrink-0 place-items-center rounded-xl bg-sky px-3 text-sm font-bold text-white disabled:opacity-40">+10</button>
                      </div>
                    </article>
                  );
                })}
            </div>
          </section>
        </div>

        {/* Resumen del pedido */}
        <aside className="card sticky top-24 p-6">
          <h2 className="font-display text-xl font-bold tracking-tight">{d.sales.cart}</h2>
          <ul className="mt-4 space-y-3">
            {cart.length === 0 && <li className="rounded-2xl bg-mist px-4 py-6 text-center text-sm text-ink-faint">{d.sales.emptyCart}</li>}
            <AnimatePresence initial={false}>
              {cart.map((it) => {
                const p = products.find((x) => x.id === it.productId)!;
                return (
                  <motion.li key={it.productId} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-start justify-between gap-3 overflow-hidden text-sm">
                    <span>
                      <span className="block font-semibold">{p.name}</span>
                      <span className="tabular block text-xs text-ink-faint">{num(it.quantity)} × {money(it.unitPrice)}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="tabular font-bold">{money(it.quantity * it.unitPrice)}</span>
                      <button aria-label="×" onClick={() => setQty(it.productId, 0)} className="text-ink-faint hover:text-danger">×</button>
                    </span>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>

          <div className="mt-5 border-t border-dashed border-line pt-4">
            <label className="label" htmlFor="notes">{d.sales.notes}</label>
            <textarea id="notes" rows={2} className="field resize-none" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="mt-5 flex items-end justify-between">
            <span className="text-sm font-bold uppercase tracking-wider text-ink-faint">{d.common.total}</span>
            <motion.span key={total} initial={{ opacity: 0.4, y: -4 }} animate={{ opacity: 1, y: 0 }} className="tabular font-display text-4xl font-extrabold tracking-tight">
              {money(total)}
            </motion.span>
          </div>

          {error && <div className="mt-4"><Notice kind="error">{error}</Notice></div>}

          <button onClick={confirm} disabled={!cart.length} className="btn btn-primary mt-5 h-13 w-full text-base">
            {d.sales.confirm}
          </button>
        </aside>
      </div>
    </>
  );
}
