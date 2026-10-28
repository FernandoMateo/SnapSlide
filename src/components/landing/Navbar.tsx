"use client";

import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useI18n } from "@/i18n/I18nProvider";

export function Navbar() {
  const { d } = useI18n();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  const links = [
    { href: "#productos", label: d.nav.products },
    { href: "#beneficios", label: d.nav.benefits },
    { href: "#distribucion", label: d.nav.distribution },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
      <nav
        className={`mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 rounded-full pl-5 pr-2 transition-[background-color,box-shadow,border-color] duration-300 ${
          scrolled ? "glass" : "border border-transparent"
        }`}
      >
        <Link href="/" aria-label="Snap Slide" className="shrink-0">
          <span className="min-[440px]:hidden">
            <LogoMark className="h-8 w-8" />
          </span>
          <span className="hidden min-[440px]:block">
            <Logo />
          </span>
        </Link>

        <ul className="hidden items-center gap-1 text-sm font-semibold text-ink-soft md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="rounded-full px-4 py-2 transition-colors hover:bg-white/70 hover:text-ink">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <PortalButton label={d.nav.portal} short={d.nav.portalShort} />
        </div>
      </nav>
    </header>
  );
}

/** Puente hacia el sistema privado: el elemento más visible de la barra. */
function PortalButton({ label, short }: { label: string; short: string }) {
  return (
    <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
      <Link
        href="/login"
        className="group relative inline-flex h-11 items-center gap-2.5 overflow-hidden rounded-full bg-ink pl-3.5 pr-4 text-sm font-bold text-white shadow-[0_0_0_1px_rgba(0,191,255,0.45),0_10px_30px_-10px_rgba(0,191,255,0.9)]"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky opacity-70" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sky" />
        </span>
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">{short}</span>
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">
          <path d="M3 8h9M8.5 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {/* barrido de luz */}
        <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-[left] duration-700 group-hover:left-[120%]" />
      </Link>
    </motion.div>
  );
}
