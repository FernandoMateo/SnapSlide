"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ForcePasswordChange } from "@/components/account/ForcePasswordChange";
import { Logo } from "@/components/brand/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useI18n } from "@/i18n/I18nProvider";
import { useCurrentUser, useStore } from "@/lib/store";

const ICON: Record<string, React.ReactNode> = {
  order: <path d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L21 8H6.2M10 20.5h.01M17 20.5h.01" />,
  orders: <path d="M8 4h8M6 8h12a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1ZM9 12h6M9 16h4" />,
  account: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0" />,
};

/** Portal de clientes: sesión propia, solo rol client. El equipo de Snap Slide va al dashboard. */
export function PortalShell({ children }: { children: React.ReactNode }) {
  const { d } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const me = useCurrentUser();
  const hydrated = useStore((s) => s.hydrated);
  const bootstrap = useStore((s) => s.bootstrap);
  const logout = useStore((s) => s.logout);
  const company = useStore((s) => s.db.clients[0]?.company);

  useEffect(() => {
    bootstrap();
    const onFocus = () => bootstrap(true);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [bootstrap]);

  useEffect(() => {
    if (!hydrated) return;
    if (!me) router.replace("/login");
    else if (me.role !== "client") router.replace("/dashboard");
  }, [hydrated, me, router]);

  if (!hydrated || !me || me.role !== "client") {
    return (
      <div className="dash-bg grid min-h-[100svh] place-items-center">
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }}>
          <Logo className="h-10" />
        </motion.div>
      </div>
    );
  }

  const nav = [
    { href: "/portal", key: "order", label: d.portal.nav.order },
    { href: "/portal/orders", key: "orders", label: d.portal.nav.orders },
    { href: "/portal/account", key: "account", label: d.portal.nav.account },
  ];
  const isActive = (href: string) => (href === "/portal" ? pathname === href : pathname.startsWith(href));
  const signOut = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="dash-bg min-h-[100svh]">
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:h-[72px] sm:px-8">
          <Link href="/portal" className="shrink-0">
            <Logo className="h-9 sm:h-10" />
          </Link>
          <span className="hidden min-w-0 truncate border-l border-line pl-4 text-sm font-bold text-ink-soft sm:block">{company}</span>
          <nav className="ml-auto hidden items-center gap-1 rounded-full bg-white/80 p-1 ring-1 ring-line md:flex">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className={`relative rounded-full px-4 py-2 text-sm font-bold transition-colors ${isActive(item.href) ? "text-white" : "text-ink-soft hover:text-ink"}`}>
                {isActive(item.href) && <motion.span layoutId="portal-nav" className="absolute inset-0 rounded-full bg-gradient-to-r from-[#035e94] to-[#0096d6]" transition={{ type: "spring", duration: 0.4, bounce: 0.15 }} />}
                <span className="relative">{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-2">
            <LanguageToggle />
            <button onClick={signOut} aria-label={d.dash.logout} title={d.dash.logout} className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink-soft ring-1 ring-line hover:text-ink">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-32 pt-6 sm:px-8 sm:pt-10 md:pb-16">
        <motion.div key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
          {children}
        </motion.div>
      </main>

      {me.mustChangePassword && <ForcePasswordChange />}

      <nav className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 grid grid-cols-3 rounded-[24px] bg-[#04121f]/92 p-1.5 shadow-[0_20px_40px_-16px_rgba(3,16,31,0.7)] backdrop-blur-xl md:hidden">
        {nav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} className={`relative flex h-14 flex-col items-center justify-center gap-1 rounded-[18px] text-[0.65rem] font-bold ${active ? "text-white" : "text-white/50"}`}>
              {active && <motion.span layoutId="portal-nav-m" className="absolute inset-0 rounded-[18px] bg-gradient-to-b from-[#0096d6] to-[#3fd0ff]" transition={{ type: "spring", duration: 0.4, bounce: 0.15 }} />}
              <svg viewBox="0 0 24 24" className="relative h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {ICON[item.key]}
              </svg>
              <span className="relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
