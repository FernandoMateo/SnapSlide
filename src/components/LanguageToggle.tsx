"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/i18n/I18nProvider";
import type { Locale } from "@/lib/types";

const OPTIONS: Locale[] = ["es", "en"];

export function LanguageToggle({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const { locale, setLocale, d } = useI18n();
  return (
    <div
      role="radiogroup"
      aria-label={d.common.language}
      className={`relative inline-flex h-9 items-center rounded-full p-1 text-xs font-bold ${
        tone === "light" ? "bg-white/15 text-white ring-1 ring-white/30" : "bg-mist text-ink-soft ring-1 ring-line"
      }`}
    >
      {OPTIONS.map((opt) => {
        const active = opt === locale;
        return (
          <button
            key={opt}
            role="radio"
            aria-checked={active}
            onClick={() => setLocale(opt)}
            className={`relative z-10 h-7 w-9 rounded-full uppercase tracking-wider transition-colors ${
              active ? (tone === "light" ? "text-abyss" : "text-white") : ""
            }`}
          >
            {active && (
              <motion.span
                layoutId={`lang-pill-${tone}`}
                className={`absolute inset-0 -z-10 rounded-full ${tone === "light" ? "bg-white" : "bg-ink"}`}
                transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
              />
            )}
            {opt}
          </button>
        );
      })}
    </div>
  );
}
