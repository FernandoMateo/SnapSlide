"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Notice } from "@/components/dashboard/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { clientAccount, productStock } from "@/lib/business";
import { useCurrentUser, useStore } from "@/lib/store";
import type { Product } from "@/lib/types";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];

/** Imagen de catálogo: caja azul para aromas frescos, caja original para el resto. */
function boxArt(p: Product) {
  return /ocean|floral|fresh/i.test(p.name) ? "/products/box-floral.webp" : "/products/box-original.webp";
}

export default function PortalOrderPage() {
  const { d, t, money, date } = useI18n();
  const me = useCurrentUser()!;
  const { products, clients, sales, payments, users } = useStore((s) => s.db);
  const createSale = useStore((s) => s.createSale);
  const client = clients[0];
  const [cart, setCart] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  const account = useMemo(() => (client ? clientAccount(client, sales, payments) : null), [client, sales, payments]);
  const last = account?.orders[0];
  const seller = users.find((u) => u.id === client?.sellerId);
  const lines = Object.entries(cart).filter(([, q]) => q > 0);
  const total = lines.reduce((s, [id, q]) => s + (products.find((p) => p.id === id)?.price ?? 0) * q, 0);
  const units = lines.reduce((s, [, q]) => s + q, 0);

  if (!client || !account) return <Notice kind="error">{d.portal.noClient}</Notice>;

  const setQty = (p: Product, q: number) => setCart((c) => ({ ...c, [p.id]: Math.max(0, Math.min(productStock(p), Math.floor(q) || 0)) }));

  const reorder = () => {
    if (!last) return;
    const next: Record<string, number> = {};
    for (const it of last.items) {
      const p = products.find((x) => x.id === it.productId);
      if (p) next[p.id] = Math.min(productStock(p), it.quantity);
    }
    setCart(next);
    setFlash(true);
    setTimeout(() => setFlash(false), 2400);
    document.getElementById("cart")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const send = async () => {
    setBusy(true);
    setError(null);
    const res = await createSale({ clientId: client.id, items: lines.map(([productId, quantity]) => ({ productId, quantity, unitPrice: 0 })), notes: notes || undefined });
    setBusy(false);
    if (!res.ok) return setError(t(res.error));
    setSent(res.id ?? "");
    setCart({});
    setNotes("");
  };

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="relative mx-auto mt-6 max-w-lg overflow-hidden rounded-[32px] p-8 text-center text-white sm:p-12" style={{ background: "linear-gradient(135deg, #035e94 0%, #0096d6 55%, #3fd0ff 100%)" }}>
        <Bubbles />
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5, delay: 0.1 }} className="relative mx-auto grid h-20 w-20 place-items-center rounded-full bg-white text-[#0096d6] shadow-[0_0_50px_rgba(255,255,255,0.6)]">
          <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
        </motion.span>
        <p className="relative mt-6 text-sm font-bold uppercase tracking-[0.2em] text-white/75">{d.portal.sent}</p>
        <p className="relative mt-2 font-display text-5xl font-extrabold tracking-tight">{sent}</p>
        <p className="relative mx-auto mt-4 max-w-sm text-white/85">{d.portal.sentText}</p>
        <div className="relative mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <button onClick={() => setSent(null)} className="btn h-12 bg-white/15 px-6 text-white ring-1 ring-white/30">{d.portal.another}</button>
          <Link href="/portal/orders" className="btn h-12 bg-white px-6 text-[#035e94]">{d.portal.seeOrders}</Link>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      {/* Bienvenida + cuenta */}
      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="relative overflow-hidden rounded-[28px] p-6 text-white sm:p-8" style={{ background: "linear-gradient(135deg, #04213d 0%, #035e94 50%, #0096d6 100%)" }}>
          <Bubbles />
          <p className="relative text-xs font-bold uppercase tracking-[0.24em] text-[#7fdcff]">{client.company}</p>
          <h1 className="relative mt-3 font-display text-[clamp(2rem,6vw,3.2rem)] font-extrabold leading-[0.95] tracking-[-0.035em]">
            {d.portal.hello}, {me.name.split(" ")[0]}.
          </h1>
          <p className="relative mt-3 max-w-md text-white/80">{d.portal.subtitle}</p>
          {last && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={reorder} className="group relative mt-6 flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left text-ink shadow-[0_20px_40px_-20px_rgba(0,0,0,0.6)] sm:w-auto sm:pr-6">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#035e94] to-[#3fd0ff] text-white transition-transform group-hover:rotate-[-20deg]">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M4 12a8 8 0 0 1 13.7-5.7L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.7L4 15.5M4 20v-4.5h4.5" /></svg>
              </span>
              <span>
                <span className="block font-display text-lg font-bold">{d.portal.reorder}</span>
                <span className="block text-xs text-ink-soft">
                  {last.number} · {date(last.date)} · {last.items.length} {d.portal.lines}
                </span>
              </span>
            </motion.button>
          )}
        </motion.div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <Stat i={1} label={d.portal.balance} value={money(account.pendingTotal)} tone={account.overdueTotal > 0 ? "warn" : "ok"} />
          <Stat i={2} label={d.portal.terms} value={`${client.paymentTerms} ${d.common.days}`} />
          {seller && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.18 }} className="card flex items-center gap-3 p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#0096d6] to-[#3fd0ff] font-display font-extrabold text-white">{seller.name[0]}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.68rem] font-bold uppercase tracking-[0.12em] text-ink-faint">{d.portal.seller}</span>
                <span className="block truncate font-bold">{seller.name}</span>
              </span>
              {seller.phone ? (
                <a href={`tel:${seller.phone.replace(/[^\d+]/g, "")}`} aria-label={seller.phone} className="grid h-10 w-10 place-items-center rounded-full bg-[#e6f8ff] text-[#035e94]">☎</a>
              ) : (
                <a href={`mailto:${seller.email}`} aria-label={seller.email} className="grid h-10 w-10 place-items-center rounded-full bg-[#e6f8ff] text-[#035e94]">@</a>
              )}
            </motion.div>
          )}
        </div>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        {/* Catálogo */}
        <section>
          <h2 className="font-display text-2xl font-bold tracking-tight">{d.portal.catalog}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((p, i) => {
              const stock = productStock(p);
              const qty = cart[p.id] ?? 0;
              return (
                <motion.article
                  key={p.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE, delay: Math.min(i, 8) * 0.05 }}
                  className={`card flex flex-col overflow-hidden transition-shadow ${qty ? "ring-2 ring-[#0096d6]" : ""} ${stock === 0 ? "opacity-60" : ""}`}
                >
                  <div className="relative grid h-36 place-items-center bg-gradient-to-br from-[#e6f8ff] to-[#cfe7fa]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={boxArt(p)} alt="" loading="lazy" decoding="async" className="h-28 w-auto rounded-[4px] shadow-[0_14px_24px_-10px_rgba(3,40,80,0.5)] transition-transform duration-500 hover:-rotate-3 hover:scale-105" />
                    <AnimatePresence>
                      {qty > 0 && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute right-3 top-3 grid h-8 min-w-8 place-items-center rounded-full bg-[#035e94] px-2 font-display text-sm font-extrabold text-white">
                          {qty}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold leading-tight">{p.name}</p>
                      <span className="tabular shrink-0 font-display font-extrabold text-[#035e94]">{money(p.price)}</span>
                    </div>
                    <p className="mt-1 text-xs text-ink-faint">{p.presentation}</p>
                    <p className={`mt-2 text-xs font-bold ${stock ? "text-[#0a7d5c]" : "text-danger"}`}>{stock ? `● ${d.sales.available}` : d.portal.outOfStock}</p>
                    <div className="mt-auto flex items-center gap-2 pt-3">
                      <button type="button" aria-label="−" disabled={!qty} onClick={() => setQty(p, qty - 1)} className="grid h-11 w-11 place-items-center rounded-xl bg-[#f2f7fb] text-lg font-bold disabled:opacity-40">−</button>
                      <input aria-label={`${d.common.quantity} ${p.name}`} type="number" inputMode="numeric" min={0} value={qty || ""} placeholder="0" onChange={(e) => setQty(p, Number(e.target.value))} className="field tabular h-11 min-h-0 flex-1 text-center" disabled={!stock} />
                      <button type="button" aria-label="+" disabled={!stock || qty >= stock} onClick={() => setQty(p, qty + 1)} className="grid h-11 w-11 place-items-center rounded-xl bg-[#0096d6] text-lg font-bold text-white disabled:opacity-40">+</button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>

        {/* Pedido */}
        <aside id="cart" className="card scroll-mt-24 p-5 sm:p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-xl font-bold tracking-tight">{d.portal.cart}</h2>
          <AnimatePresence>{flash && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3"><Notice kind="success">{d.portal.reorderDone}</Notice></motion.div>}</AnimatePresence>
          <ul className="mt-4 space-y-3">
            {lines.length === 0 && <li className="rounded-2xl bg-[#f2f7fb] px-4 py-6 text-center text-sm text-ink-faint">{d.portal.empty}</li>}
            <AnimatePresence initial={false}>
              {lines.map(([id, q]) => {
                const p = products.find((x) => x.id === id)!;
                return (
                  <motion.li key={id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-start justify-between gap-3 overflow-hidden text-sm">
                    <span>
                      <span className="block font-semibold">{p.name}</span>
                      <span className="tabular block text-xs text-ink-faint">{q} × {money(p.price)}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="tabular font-bold">{money(q * p.price)}</span>
                      <button aria-label="×" onClick={() => setQty(p, 0)} className="text-ink-faint hover:text-danger">×</button>
                    </span>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
          <div className="mt-5 border-t border-dashed border-line pt-4">
            <label className="label" htmlFor="p-notes">{d.portal.notes}</label>
            <textarea id="p-notes" rows={2} className="field resize-none" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="mt-5 flex items-end justify-between">
            <span className="text-sm font-bold uppercase tracking-wider text-ink-faint">{d.common.total}</span>
            <motion.span key={total} initial={{ opacity: 0.4, y: -4 }} animate={{ opacity: 1, y: 0 }} className="tabular font-display text-4xl font-extrabold tracking-tight">{money(total)}</motion.span>
          </div>
          {error && <div className="mt-4"><Notice kind="error">{error}</Notice></div>}
          <button onClick={send} disabled={!lines.length || busy} className="btn btn-primary mt-5 h-13 w-full text-base">{busy ? d.portal.sending : d.portal.send}</button>
        </aside>
      </div>

      {/* Barra de pedido flotante en móvil */}
      <AnimatePresence>
        {units > 0 && (
          <motion.a
            href="#cart"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-between rounded-2xl bg-gradient-to-r from-[#035e94] to-[#0096d6] px-5 py-3.5 text-white shadow-[0_18px_40px_-14px_rgba(0,90,150,0.8)] lg:hidden"
          >
            <span className="text-sm font-bold">{units} · {d.portal.cart}</span>
            <span className="tabular font-display text-lg font-extrabold">{money(total)} →</span>
          </motion.a>
        )}
      </AnimatePresence>
    </>
  );
}

function Stat({ i, label, value, tone }: { i: number; label: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: i * 0.06 }} className="card p-4">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-ink-faint">{label}</p>
      <p className={`tabular mt-1 font-display text-2xl font-extrabold tracking-tight ${tone === "warn" ? "text-[#b86b00]" : ""}`}>{value}</p>
    </motion.div>
  );
}

function Bubbles() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {[12, 30, 55, 72, 88].map((l, i) => (
        <motion.span
          key={i}
          className="absolute bottom-0 rounded-full border border-white/40 bg-white/10"
          style={{ left: `${l}%`, width: 8 + (i % 3) * 5, height: 8 + (i % 3) * 5 }}
          animate={{ y: ["0%", "-1600%"], opacity: [0, 0.9, 0] }}
          transition={{ duration: 8 + i, delay: i * 1.3, repeat: Infinity, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
