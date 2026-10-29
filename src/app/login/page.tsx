"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { SheetCard } from "@/components/landing/SheetCard";
import { useI18n } from "@/i18n/I18nProvider";
import { useCurrentUser, useStore } from "@/lib/store";

export default function LoginPage() {
  const { d, t } = useI18n();
  const router = useRouter();
  const login = useStore((s) => s.login);
  const bootstrap = useStore((s) => s.bootstrap);
  const user = useCurrentUser();
  const hydrated = useStore((s) => s.hydrated);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Si ya hay sesión, directo a su espacio: el cliente a su portal, el equipo al sistema.
  useEffect(() => {
    bootstrap();
  }, [bootstrap]);
  useEffect(() => {
    if (hydrated && user) router.replace(user.role === "client" ? "/portal" : "/dashboard");
  }, [hydrated, user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await login(email, password);
    setBusy(false);
    if (res.ok) router.push(res.role === "client" ? "/portal" : "/dashboard");
    else setError(t(res.error));
  };

  return (
    <div className="grid min-h-[100svh] lg:grid-cols-[1fr_1.05fr]">
      {/* Panel de marca */}
      <aside
        className="relative hidden overflow-hidden lg:block"
        style={{ background: "radial-gradient(120% 90% at 30% 20%, #00BFFF 0%, #0A7FE0 45%, #0A3FBF 100%)" }}
      >
        <div className="absolute left-10 top-10">
          <Logo tone="light" />
        </div>
        <div className="absolute inset-0 grid place-items-center" style={{ perspective: 1000 }}>
          <motion.div
            initial={{ rotateX: 30, rotateY: -30, opacity: 0, scale: 0.8 }}
            animate={{ rotateX: 18, rotateY: -22, opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-[min(30vw,380px)] text-[15px]"
          >
            <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
              <SheetCard className="w-full" />
            </motion.div>
          </motion.div>
        </div>
        <p className="absolute bottom-10 left-10 max-w-sm font-display text-3xl font-bold leading-tight text-white">{d.auth.subtitle}</p>
      </aside>

      {/* Formulario */}
      <main className="relative flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft hover:text-ink">
            <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden><path d="M13 8H4m3.5-4-4 4 4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {d.auth.back}
          </Link>
          <LanguageToggle />
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <div className="lg:hidden">
            <Logo />
          </div>
          <h1 className="mt-8 font-display text-4xl font-extrabold tracking-[-0.03em] text-ink lg:mt-0">{d.auth.title}</h1>
          <p className="mt-2 text-ink-soft lg:hidden">{d.auth.subtitle}</p>

          <form onSubmit={submit} className="mt-8 grid gap-4">
            <div>
              <label className="label" htmlFor="email">{d.auth.email}</label>
              <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
            </div>
            <div>
              <label className="label" htmlFor="password">{d.auth.password}</label>
              <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="field" />
            </div>
            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
                {error}
              </motion.p>
            )}
            <button type="submit" disabled={busy} className="btn btn-primary mt-2 h-12 text-base">{d.auth.submit}</button>
          </form>

          <p className="mt-8 text-sm text-ink-soft">{d.auth.help}</p>
        </div>
      </main>
    </div>
  );
}
