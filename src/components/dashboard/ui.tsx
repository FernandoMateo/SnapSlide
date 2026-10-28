"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import type { SaleStatus } from "@/lib/types";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-[clamp(1.9rem,3.6vw,2.8rem)] font-extrabold leading-none tracking-[-0.035em] text-ink">{title}</h1>
        {subtitle && <p className="mt-2 text-ink-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const STATUS_STYLE: Record<SaleStatus, string> = {
  pending: "bg-warn/12 text-[#b86b00] ring-warn/30",
  paid: "bg-sky/12 text-sky-deep ring-sky/30",
  shipped: "bg-ok/12 text-[#0a7d5c] ring-ok/30",
};

export function StatusBadge({ status }: { status: SaleStatus }) {
  const { d } = useI18n();
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${STATUS_STYLE[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {d.sales.statuses[status]}
    </span>
  );
}

/** Panel lateral (drawer) para formularios y detalles. Pantalla completa en móvil. */
export function Drawer({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  const { d } = useI18n();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <motion.div className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className={`absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-2xl ${wide ? "sm:max-w-3xl" : "sm:max-w-xl"}`}
          >
            <header className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 className="font-display text-xl font-bold tracking-tight">{title}</h2>
              <button onClick={onClose} aria-label={d.common.close} className="grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-mist hover:text-ink">
                <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden><path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

export function Notice({ kind = "info", children }: { kind?: "info" | "error" | "success"; children: React.ReactNode }) {
  const style = {
    info: "bg-sky-soft text-sky-deep",
    error: "bg-danger/10 text-danger",
    success: "bg-ok/10 text-[#0a7d5c]",
  }[kind];
  return (
    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role={kind === "error" ? "alert" : "status"} className={`rounded-xl px-3 py-2 text-sm font-semibold ${style}`}>
      {children}
    </motion.p>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="relative block w-full sm:w-80">
      <svg viewBox="0 0 20 20" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden>
        <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="m14 14 3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <span className="sr-only">{placeholder}</span>
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="field pl-10" />
    </label>
  );
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="inline-flex rounded-full bg-mist p-1 ring-1 ring-line">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={o.value === value}
          className={`relative h-9 rounded-full px-4 text-sm font-bold transition-colors ${o.value === value ? "text-white" : "text-ink-soft hover:text-ink"}`}
        >
          {o.value === value && <motion.span layoutId={`seg-${options.map((x) => x.value).join("")}`} className="absolute inset-0 -z-0 rounded-full bg-ink" transition={{ type: "spring", duration: 0.35, bounce: 0.15 }} />}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-ink-faint">
        {label}
      </td>
    </tr>
  );
}

/** Tabla con encabezado fijo y scroll horizontal en móvil. */
export function Table({ head, children }: { head: React.ReactNode[]; children: React.ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-mist/70 text-[0.7rem] font-bold uppercase tracking-[0.08em] text-ink-faint">
            <tr>
              {head.map((h, i) => (
                <th key={i} className="whitespace-nowrap px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">{children}</tbody>
        </table>
      </div>
    </div>
  );
}
