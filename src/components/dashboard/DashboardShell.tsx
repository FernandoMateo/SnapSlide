"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/brand/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useI18n } from "@/i18n/I18nProvider";
import { can } from "@/lib/business";
import { useLeads } from "@/lib/leads";
import { useCurrentUser, useStore } from "@/lib/store";

const ICON: Record<string, React.ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" />,
  products: <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9ZM4 7.5l8 4.5 8-4.5M12 12v9" />,
  inventory: <path d="M3 21V8l9-5 9 5v13M7 21v-8h10v8M7 17h10" />,
  sales: <path d="M4 19V5m0 14h16M8 15l3-4 3 2 5-6" />,
  newSale: <path d="M12 5v14M5 12h14" />,
  leads: <path d="M4 13h4l1.5 3h5L16 13h4M4 13l2.5-7.5A2 2 0 0 1 8.4 4h7.2a2 2 0 0 1 1.9 1.5L20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5Z" />,
  clients: <path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM21 19v-1a4 4 0 0 0-3-3.87M16 3.13a3.5 3.5 0 0 1 0 6.75" />,
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { d } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useStore((s) => s.hydrated);
  const user = useCurrentUser();
  const logout = useStore((s) => s.logout);
  const resetDemo = useStore((s) => s.resetDemo);
  const loadLeads = useLeads((s) => s.load);
  const newLeads = useLeads((s) => s.leads.filter((l) => l.status === "new").length);
  const canLeads = can(user, "leads.manage");

  // Contador de solicitudes nuevas en el menú (solo Owner).
  useEffect(() => {
    if (canLeads) loadLeads();
  }, [canLeads, loadLeads]);

  useEffect(() => {
    if (hydrated && !user) router.replace("/login");
  }, [hydrated, user, router]);

  if (!hydrated || !user) {
    return (
      <div className="grid min-h-[100svh] place-items-center">
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }} className="flex items-center gap-3 text-sm font-semibold text-ink-soft">
          <Logo className="h-8" />
          {d.dash.loading}
        </motion.div>
      </div>
    );
  }

  const nav = [
    { href: "/dashboard", key: "home", label: d.dash.home },
    { href: "/dashboard/sales", key: "sales", label: d.dash.sales },
    { href: "/dashboard/sales/new", key: "newSale", label: d.dash.newSale },
    { href: "/dashboard/clients", key: "clients", label: d.dash.clients },
    ...(canLeads ? [{ href: "/dashboard/leads", key: "leads", label: d.dash.leads }] : []),
    { href: "/dashboard/products", key: "products", label: d.dash.products },
    ...(can(user, "inventory.manage") ? [{ href: "/dashboard/inventory", key: "inventory", label: d.dash.inventory }] : []),
  ];

  // "Inicio" y "Ventas" son prefijos de otras rutas: solo se marcan con coincidencia exacta.
  const isActive = (href: string) => (href === "/dashboard" || href === "/dashboard/sales" ? pathname === href : pathname.startsWith(href));

  const roleLabel = user.role === "owner" ? d.dash.roleOwner : d.dash.roleSeller;
  const signOut = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="dash-bg min-h-[100svh]">
      {/* Sidebar escritorio: panel oscuro flotante */}
      <aside className="fixed inset-y-3 left-3 z-40 hidden w-64 flex-col overflow-hidden rounded-[28px] px-4 py-6 text-white shadow-[0_30px_60px_-30px_rgba(3,16,31,0.8)] lg:flex" style={{ background: "linear-gradient(180deg, #06203a 0%, #04121f 100%)" }}>
        <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-[#00bfff]/25 blur-3xl" />
        <Link href="/" className="relative px-3">
          <Logo className="h-11" tone="light" />
        </Link>
        <p className="relative mt-10 px-3 text-[0.62rem] font-bold uppercase tracking-[0.24em] text-white/35">{d.dash.menu}</p>
        <nav className="relative mt-3 grid gap-1">
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex h-11 items-center gap-3 rounded-2xl px-3 text-sm font-bold transition-colors ${active ? "text-white" : "text-white/55 hover:bg-white/5 hover:text-white"}`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#0096d6] to-[#3fd0ff] shadow-[0_10px_24px_-10px_rgba(0,191,255,0.8)]"
                    transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
                  />
                )}
                <svg viewBox="0 0 24 24" className="relative h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {ICON[item.key]}
                </svg>
                <span className="relative">{item.label}</span>
                {item.key === "leads" && newLeads > 0 && <span className="relative ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-[#3fd0ff] px-1.5 text-[0.65rem] font-extrabold text-[#04121f]">{newLeads}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="relative mt-auto grid gap-2">
          <button onClick={() => window.confirm(d.dash.resetConfirm) && resetDemo()} className="rounded-xl px-3 py-2 text-left text-xs font-semibold text-white/40 transition-colors hover:bg-white/5 hover:text-white">
            ↺ {d.dash.resetDemo}
          </button>
          <div className="flex items-center gap-3 rounded-2xl bg-white/[0.06] p-3 ring-1 ring-white/10">
            <Avatar name={user.name} owner={user.role === "owner"} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">{user.name}</span>
              <span className="block truncate text-xs text-white/50">{roleLabel}</span>
            </span>
            <button onClick={signOut} aria-label={d.dash.logout} title={d.dash.logout} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white/50 transition-colors hover:bg-white/10 hover:text-white">
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Barra superior: vidrio esmerilado */}
      <header className="sticky top-0 z-30 lg:ml-[17.5rem]">
        <div className="flex h-16 items-center justify-between gap-3 border-b border-white/60 bg-white/60 px-4 backdrop-blur-xl sm:px-8 lg:h-[76px] lg:border-0 lg:bg-transparent lg:backdrop-blur-none">
          <Link href="/" className="lg:hidden">
            <Logo className="h-9" />
          </Link>
          <p className="hidden text-sm text-ink-soft lg:block">
            {d.dash.greeting}, <span className="font-bold text-ink">{user.name.split(" ")[0]}</span>
          </p>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <span className={`hidden rounded-full px-3 py-1.5 text-xs font-bold sm:inline ${user.role === "owner" ? "bg-ink text-white" : "bg-sky-soft text-sky-deep"}`}>{roleLabel}</span>
            <span className="lg:hidden">
              <Avatar name={user.name} owner={user.role === "owner"} small />
            </span>
            <button onClick={signOut} aria-label={d.dash.logout} className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink-soft ring-1 ring-line lg:hidden">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 pb-32 pt-6 sm:px-8 lg:ml-[17.5rem] lg:pb-16 lg:pt-2">
        <motion.div key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="mx-auto max-w-[1400px]">
          {children}
        </motion.div>
      </main>

      {/* Navegación inferior móvil: barra flotante */}
      <nav className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 rounded-[24px] bg-[#04121f]/92 p-1.5 shadow-[0_20px_40px_-16px_rgba(3,16,31,0.7)] backdrop-blur-xl lg:hidden">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} className={`relative flex h-14 flex-col items-center justify-center gap-1 rounded-[18px] text-[0.6rem] font-bold ${active ? "text-white" : "text-white/50"}`}>
                {active && <motion.span layoutId="nav-active-m" className="absolute inset-0 rounded-[18px] bg-gradient-to-b from-[#0096d6] to-[#3fd0ff]" transition={{ type: "spring", duration: 0.4, bounce: 0.15 }} />}
                <svg viewBox="0 0 24 24" className="relative h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {ICON[item.key]}
                </svg>
                <span className="relative max-w-full truncate px-1">{item.label}</span>
                {item.key === "leads" && newLeads > 0 && <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#3fd0ff] px-1 text-[0.55rem] font-extrabold text-[#04121f]">{newLeads}</span>}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function Avatar({ name, owner, small }: { name: string; owner: boolean; small?: boolean }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full font-extrabold text-white ${small ? "h-9 w-9 text-sm" : "h-10 w-10"}`}
      style={{ background: owner ? "linear-gradient(135deg, #0b1b2b, #035e94)" : "linear-gradient(135deg, #0096d6, #3fd0ff)" }}
    >
      {name[0]}
    </span>
  );
}
