"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";
import { saleTotal } from "@/lib/business";
import { useStore } from "@/lib/store";
import type { Sale, SaleStatus } from "@/lib/types";

const EASE = [0.16, 1, 0.3, 1] as [number, number, number, number];
const STEPS: SaleStatus[] = ["pending", "paid", "shipped"];

export default function PortalOrdersPage() {
  const { d } = useI18n();
  const sales = useStore((s) => s.db.sales);
  const orders = [...sales].sort((a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number));

  return (
    <>
      <h1 className="font-display text-[clamp(2rem,5vw,2.8rem)] font-extrabold leading-none tracking-[-0.035em]">{d.portal.nav.orders}</h1>
      {orders.length === 0 ? (
        <div className="card mt-6 grid place-items-center px-6 py-16 text-center">
          <p className="text-ink-soft">{d.portal.noOrders}</p>
          <Link href="/portal" className="btn btn-primary mt-5 h-11 px-6 text-sm">{d.portal.nav.order}</Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-3">
          {orders.map((s, i) => (
            <OrderCard key={s.id} sale={s} index={i} />
          ))}
        </ul>
      )}
    </>
  );
}

function OrderCard({ sale, index }: { sale: Sale; index: number }) {
  const { d, money, date, num } = useI18n();
  const products = useStore((s) => s.db.products);
  const reached = STEPS.indexOf(sale.status);
  return (
    <motion.li initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: EASE, delay: Math.min(index, 10) * 0.04 }} className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-2xl font-extrabold tracking-tight">{sale.number}</p>
          <p className="text-sm text-ink-soft">
            {date(sale.date)} · {d.portal.due} {date(sale.dueDate)}
            {sale.channel === "portal" && <span className="ml-2 rounded-full bg-[#e6f8ff] px-2 py-0.5 text-[0.65rem] font-extrabold text-[#035e94]">{d.portal.viaPortal}</span>}
          </p>
        </div>
        <p className="tabular font-display text-2xl font-extrabold">{money(saleTotal(sale))}</p>
      </div>

      {/* Estado en 3 pasos, como el recorrido del distribuidor */}
      <ol className="mt-5 grid grid-cols-3 gap-2" aria-label={d.portal.status[sale.status]}>
        {STEPS.map((st, i) => (
          <li key={st}>
            <span className="block h-1.5 overflow-hidden rounded-full bg-[#e3ebf2]">
              <motion.span className="block h-full origin-left bg-gradient-to-r from-[#035e94] to-[#3fd0ff]" initial={{ scaleX: 0 }} animate={{ scaleX: i <= reached ? 1 : 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.2 + i * 0.12 }} />
            </span>
            <span className={`mt-1.5 flex items-center gap-1 text-xs font-bold ${i <= reached ? "text-[#035e94]" : "text-ink-faint"}`}>
              <span className="font-display">{String(i + 1).padStart(2, "0")}</span> {d.portal.status[st]}
            </span>
          </li>
        ))}
      </ol>

      <ul className="mt-4 flex flex-wrap gap-2 text-xs">
        {sale.items.map((it) => (
          <li key={it.productId} className="rounded-full bg-[#f2f7fb] px-3 py-1.5 font-semibold text-ink-soft">
            {num(it.quantity)} × {products.find((p) => p.id === it.productId)?.name ?? it.productId}
          </li>
        ))}
      </ul>
      {sale.notes && <p className="mt-3 text-sm italic text-ink-faint">“{sale.notes}”</p>}
    </motion.li>
  );
}
