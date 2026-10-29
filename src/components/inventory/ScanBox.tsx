"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { daysBetween, today } from "@/lib/dates";
import { lotsFEFO, productStock } from "@/lib/business";
import { useStore } from "@/lib/store";
import type { Lot, Product } from "@/lib/types";
import type { LabelData } from "./LotLabel";
import { labelFor } from "./labelFor";

type Hit = { kind: "lot"; product: Product; lot: Lot } | { kind: "product"; product: Product };

/**
 * Búsqueda por código. Los lectores de código de barras USB/Bluetooth "escriben" el código
 * y envían Enter, así que basta un campo con foco: sirve igual con lector o a mano.
 */
export function ScanBox({ onLabel }: { onLabel: (l: LabelData) => void }) {
  const { d, num, date } = useI18n();
  const db = useStore((s) => s.db);
  const input = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [last, setLast] = useState("");

  const search = (raw: string) => {
    const q = raw.trim().toUpperCase();
    if (!q) return;
    const found: Hit[] = [];
    for (const p of db.products) {
      if (p.sku.toUpperCase() === q) found.push({ kind: "product", product: p });
      for (const l of p.lots) if (l.code.toUpperCase() === q) found.push({ kind: "lot", product: p, lot: l });
    }
    setHits(found);
    setLast(q);
    setCode("");
    input.current?.focus();
  };

  const labelOf = (product: Product, lot: Lot) => {
    const m = db.movements.find((x) => x.type === "in" && x.productId === product.id && x.lotCode === lot.code);
    return labelFor(db, m ?? { productId: product.id, lotCode: lot.code, quantity: lot.quantity, date: lot.receivedAt, reason: "production", userId: "" }, d.inventory.reasons[m?.reason ?? "production"]);
  };

  return (
    <section className="relative mb-8 overflow-hidden rounded-[24px] p-5 text-white sm:p-6" style={{ background: "linear-gradient(135deg, #04213d 0%, #035e94 55%, #0096d6 100%)" }}>
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#3fd0ff]/25 blur-3xl" />
      <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-center">
        <div>
          <h2 className="flex items-center gap-2 font-display text-xl font-bold">
            <ScanIcon /> {d.inventory.scanTitle}
          </h2>
          <p className="mt-1 text-sm text-white/75">{d.inventory.scanHint}</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            search(code);
          }}
          className="relative"
        >
          <input
            ref={input}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={d.inventory.scanPlaceholder}
            aria-label={d.inventory.scanPlaceholder}
            autoComplete="off"
            spellCheck={false}
            className="field-bare h-14 w-full rounded-2xl bg-white/12 pl-5 pr-28 font-mono text-lg font-bold uppercase tracking-wider text-white ring-1 ring-white/25 placeholder:font-sans placeholder:text-base placeholder:font-semibold placeholder:normal-case placeholder:tracking-normal placeholder:text-white/50 focus:bg-white/18 focus:ring-2 focus:ring-[#7fdcff]"
          />
          {/* Láser de escaneo */}
          <motion.span aria-hidden className="pointer-events-none absolute inset-x-4 top-1/2 h-px bg-[#ff3b5c]/70 shadow-[0_0_8px_#ff3b5c]" animate={{ opacity: [0.2, 0.8, 0.2] }} transition={{ duration: 1.6, repeat: Infinity }} />
          <button type="submit" className="absolute right-2 top-2 h-10 rounded-xl bg-white px-4 text-sm font-bold text-[#035e94]">{"↵"}</button>
        </form>
      </div>

      <AnimatePresence mode="wait">
        {hits && (
          <motion.div key={last} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="relative mt-5 grid gap-3">
            {hits.length === 0 && <p className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold">{d.inventory.scanNone} <span className="font-mono">{last}</span></p>}
            {hits.map((h, i) =>
              h.kind === "lot" ? (
                <div key={i} className="grid gap-3 rounded-2xl bg-white p-4 text-ink sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0096d6]">{d.inventory.lot} · <span className="font-mono">{h.lot.code}</span></p>
                    <p className="mt-1 truncate font-display text-lg font-bold">{h.product.name}</p>
                    <p className="mt-1 text-sm text-ink-soft">
                      {d.inventory.remaining} <b className="text-ink">{num(h.lot.quantity)} {d.common.units}</b> · {d.labels.received} {date(h.lot.receivedAt)} · {d.labels.expires} {date(h.lot.expiresAt)} ({daysBetween(today(), h.lot.expiresAt)} {d.common.days})
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const data = labelOf(h.product, h.lot);
                      if (data) onLabel(data);
                    }}
                    className="btn btn-primary h-11 px-5 text-sm"
                  >
                    🏷 {d.inventory.printLabel}
                  </button>
                </div>
              ) : (
                <div key={i} className="rounded-2xl bg-white p-4 text-ink">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0096d6]">SKU · <span className="font-mono">{h.product.sku}</span></p>
                  <p className="mt-1 font-display text-lg font-bold">
                    {h.product.name} · <span className="tabular">{num(productStock(h.product))}</span> <span className="text-sm font-semibold text-ink-faint">{d.common.units}</span>
                  </p>
                  <p className="mt-3 label">{d.inventory.lotsOf}</p>
                  <ul className="flex flex-wrap gap-2">
                    {lotsFEFO(h.product).map((l) => (
                      <li key={l.id}>
                        <button
                          onClick={() => {
                            const data = labelOf(h.product, l);
                            if (data) onLabel(data);
                          }}
                          className="rounded-full bg-[#e6f8ff] px-3 py-1.5 text-xs font-bold text-[#035e94] hover:bg-[#035e94] hover:text-white"
                          title={d.inventory.printLabel}
                        >
                          🏷 <span className="font-mono">{l.code}</span> · {num(l.quantity)} · {date(l.expiresAt)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ),
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ScanIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 8v8M10 8v8M13 8v8M16 8v8" />
    </svg>
  );
}
