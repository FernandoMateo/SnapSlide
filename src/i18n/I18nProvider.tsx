"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/types";
import en from "./en";
import es, { type Dictionary } from "./es";

const DICTS: Record<Locale, Dictionary> = { es, en };
const STORAGE_KEY = "snapslide-locale";

interface I18nValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** Diccionario tipado: `d.nav.portal` */
  d: Dictionary;
  /** Traducción por ruta de texto, útil para claves dinámicas: t("auth.invalid") */
  t: (path: string) => string;
  money: (n: number, opts?: { compact?: boolean }) => string;
  date: (iso: string, opts?: Intl.DateTimeFormatOptions) => string;
  num: (n: number) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "es" || saved === "en") setLocaleState(saved);
      else if (navigator.language.toLowerCase().startsWith("en")) setLocaleState("en");
    } catch {
      /* almacenamiento bloqueado: se queda en español */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignorar */
    }
  }, []);

  const value = useMemo<I18nValue>(() => {
    const d = DICTS[locale];
    const tag = locale === "es" ? "es-US" : "en-US";
    // Montos grandes sin centavos; precios unitarios con centavos.
    const currency = new Intl.NumberFormat(tag, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
    const currencyCents = new Intl.NumberFormat(tag, { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const compact = new Intl.NumberFormat(tag, { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 });
    const number = new Intl.NumberFormat(tag);
    return {
      locale,
      setLocale,
      d,
      t: (path) => {
        const v = path.split(".").reduce<unknown>((acc, k) => (acc as Record<string, unknown> | undefined)?.[k], d);
        return typeof v === "string" ? v : path;
      },
      money: (n, opts) => (opts?.compact ? compact : Math.abs(n) < 1000 && !Number.isInteger(n) ? currencyCents : currency).format(n),
      date: (iso, opts) => {
        const [y, m, day] = iso.split("-").map(Number);
        return new Date(y, m - 1, day).toLocaleDateString(tag, opts ?? { day: "2-digit", month: "short", year: "numeric" });
      },
      num: (n) => number.format(n),
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
