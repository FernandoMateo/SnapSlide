"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";

/** La caja interactiva a pantalla completa (public/caja-3d.html). */
export default function BoxPage() {
  const { d, locale } = useI18n();
  return (
    <div className="fixed inset-0 bg-[#0a0d24]">
      <h1 className="sr-only">{d.studio.title}</h1>
      <iframe key={locale} src={`/caja-3d.html?lang=${locale}`} title={d.studio.title} className="block h-full w-full" />
      <Link
        href="/"
        aria-label={d.studio.back}
        className="absolute left-4 top-[calc(max(1rem,env(safe-area-inset-top))+3.75rem)] grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-black/60"
      >
        ←
      </Link>
    </div>
  );
}
