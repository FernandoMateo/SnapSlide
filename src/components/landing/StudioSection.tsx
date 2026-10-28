"use client";

import Link from "next/link";
import { PetalCluster } from "@/components/fx/Petals";
import { WaterTitle } from "@/components/fx/WaterTitle";
import { useI18n } from "@/i18n/I18nProvider";

/**
 * Estudio 3D: la caja interactiva original (public/caja-3d.html) incrustada tal cual.
 * El HTML lee `?lang=` para el idioma; se recarga al cambiar de idioma.
 */
export function StudioSection() {
  const { d, locale } = useI18n();
  return (
    <section id="estudio" className="relative -mt-px bg-[linear-gradient(180deg,#140a1f_0%,#140a1f_70%,#ffffff_100%)] px-4 pb-24 pt-20 sm:px-8 sm:pb-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6 sm:mb-10">
          <div className="relative max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-sky">{d.studio.kicker}</p>
            <WaterTitle
              lines={[d.studio.title]}
              className="mt-4 font-display text-[clamp(2.2rem,9vw,4.2rem)] font-extrabold leading-[0.95] tracking-[-0.035em] text-white sm:text-[clamp(2.2rem,5vw,4.2rem)]"
            />
            <PetalCluster className="-top-6 right-0 sm:-right-16" />
            <p className="mt-4 text-base text-white/70 sm:text-lg">{d.studio.lead}</p>
          </div>
          <Link href="/caja" className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-white/20">
            ⤢ {d.studio.fullscreen}
          </Link>
        </div>
        <div className="overflow-hidden rounded-[2rem] bg-[#0a0d24] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)] ring-1 ring-white/12">
          <iframe
            key={locale}
            src={`/caja-3d.html?lang=${locale}`}
            title={d.studio.title}
            loading="lazy"
            className="block h-[78svh] min-h-[520px] w-full sm:h-[min(82svh,820px)] sm:min-h-[560px]"
          />
        </div>
      </div>
    </section>
  );
}
