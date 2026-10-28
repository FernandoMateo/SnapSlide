import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = { title: "Página no encontrada", robots: { index: false }, alternates: { canonical: null } };

/** 404 bilingüe estático (no depende del idioma elegido para poder servirse sin JavaScript). */
export default function NotFound() {
  return (
    <main className="grid min-h-[100svh] place-items-center bg-[linear-gradient(180deg,#f7fcff_0%,#cdeeff_100%)] px-5 text-center">
      <div>
        <Logo className="mx-auto h-14" />
        <p className="mt-10 font-display text-7xl font-extrabold tracking-[-0.04em] text-sky">404</p>
        <h1 className="mt-3 font-display text-2xl font-bold text-ink">Esta página se disolvió · This page dissolved</h1>
        <Link href="/" className="btn btn-primary mt-8 inline-flex h-12 px-6">
          Volver al inicio · Back home
        </Link>
      </div>
    </main>
  );
}
