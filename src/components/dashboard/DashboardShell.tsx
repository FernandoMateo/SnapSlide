"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Logo } from "@/components/brand/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useI18n } from "@/i18n/I18nProvider";
import { can } from "@/lib/business";
import { useCurrentUser, useStore } from "@/lib/store";

const ICON: Record<string, React.ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z" />,
  products: <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9ZM4 7.5l8 4.5 8-4.5M12 12v9" />,
  inventory: <path d="M3 21V8l9-5 9 5v13M7 21v-8h10v8M7 17h10" />,
  sales: <path d="M4 19V5m0 14h16M8 15l3-4 3 2 5-6" />,
  newSale: <path d="M12 5v14M5 12h14" />,
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
    { href: "/dashboard/products", key: "products", label: d.dash.products },
    ...(can(user, "inventory.manage") ? [{ href: "/dashboard/inventory", key: "inventory", label: d.dash.inventory }] : []),
  ];

  // "Inicio" y "Ventas" son prefijos de otras rutas: solo se marcan con coincidencia exacta.
  const isActive = (href: string) => (href === "/dashboard" || href === "/dashboard/sales" ? pathname === href : pathname.startsWith(href));

  return (
    <div className="min-h-[100svh] bg-mist">
      {/* Sidebar escritorio */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-white/80 px-4 py-6 backdrop-blur-xl lg:flex">
        <Link href="/" className="px-3">
          <Logo className="h-12" />
        </Link>
        <nav className="mt-10 grid gap-1">
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition-colors ${active ? "text-ink" : "text-ink-soft hover:bg-mist hover:text-ink"}`}
              >
                {active && <motion.span layoutId="nav-active" className="absolute inset-0 rounded-xl bg-sky-soft ring-1 ring-sky/25" transition={{ type: "spring", duration: 0.4, bounce: 0.12 }} />}
                <svg viewBox="0 0 24 24" className={`relative h-5 w-5 ${active ? "text-sky-deep" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {ICON[item.key]}
                </svg>
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto grid gap-3">
          <button
            onClick={() => window.confirm(d.dash.resetConfirm) && resetDemo()}
            className="rounded-xl px-3 py-2 text-left text-xs font-semibold text-ink-faint hover:bg-mist hover:text-ink"
          >
            ↺ {d.dash.resetDemo}
          </button>
          <UserCard name={user.name} role={user.role === "owner" ? d.dash.roleOwner : d.dash.roleSeller} owner={user.role === "owner"} />
          <button onClick={() => { logout(); router.push("/login"); }} className="btn btn-ghost h-10 text-sm">
            {d.dash.logout}
          </button>
        </div>
      </aside>

      {/* Barra superior */}
      <header className="sticky top-0 z-30 border-b border-line bg-white/75 backdrop-blur-xl lg:ml-64">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-8">
          <Link href="/" className="lg:hidden">
            <Logo className="h-9" />
          </Link>
          <p className="hidden text-sm text-ink-soft lg:block">
            {d.dash.greeting}, <span className="font-bold text-ink">{user.name}</span>
          </p>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <span className={`hidden rounded-full px-3 py-1.5 text-xs font-bold sm:inline ${user.role === "owner" ? "bg-ink text-white" : "bg-sky-soft text-sky-deep"}`}>
              {user.role === "owner" ? d.dash.roleOwner : d.dash.roleSeller}
            </span>
            <button onClick={() => { logout(); router.push("/login"); }} className="btn btn-ghost h-9 px-3 text-xs lg:hidden">
              {d.dash.logout}
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 pb-28 pt-8 sm:px-8 lg:ml-64 lg:pb-16">
        <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="mx-auto max-w-[1400px]">
          {children}
        </motion.div>
      </main>

      {/* Navegación inferior móvil */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} className={`flex h-16 flex-col items-center justify-center gap-1 text-[0.62rem] font-bold ${active ? "text-sky-deep" : "text-ink-faint"}`}>
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {ICON[item.key]}
                </svg>
                <span className="max-w-full truncate px-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function UserCard({ name, role, owner }: { name: string; role: string; owner: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-mist px-3 py-3">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full font-extrabold ${owner ? "bg-ink text-white" : "bg-sky text-white"}`}>{name[0]}</span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold">{name}</span>
        <span className="block truncate text-xs text-ink-faint">{role}</span>
      </span>
    </div>
  );
}
