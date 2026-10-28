"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { useI18n } from "@/i18n/I18nProvider";

export function Footer() {
  const { d } = useI18n();
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-ink-soft">{d.footer.tagline}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold text-ink-soft">
          <a href="#la-caja" className="hover:text-ink">{d.nav.products}</a>
          <a href="#distribucion" className="hover:text-ink">{d.nav.distribution}</a>
          <Link href="/login" className="text-sky-deep hover:text-ink">{d.nav.portal}</Link>
          <span className="text-ink-faint">© {new Date().getFullYear()} Snap Slide · {d.footer.rights}</span>
        </div>
      </div>
    </footer>
  );
}
