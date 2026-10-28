"use client";

/**
 * Pétalos celestes, el mismo motivo que acompaña a la caja Floral Fantasy.
 * - `Petal`: un pétalo suelto.
 * - `PetalDrift`: capa fija con pétalos que caen y se mecen por toda la página (solo CSS, sin JS por fotograma).
 * - `PetalCluster`: dos o tres pétalos flotando junto a un título.
 */
import { useId } from "react";

export function Petal({ size = 28, className = "", style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 40 50" width={size} height={size * 1.25} className={className} style={style} aria-hidden>
      <defs>
        <linearGradient id={`pg-${id}`} x1="0.3" y1="1" x2="0.6" y2="0">
          <stop offset="0" stopColor="#5fbdf4" />
          <stop offset="0.45" stopColor="#bfe7ff" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
      </defs>
      {/* Pétalo de cerezo: base angosta, punta ancha con muesca; el borde derecho se curva como en la caja */}
      <path d="M20 48 C14 44 6 34 5 22 C4 12 9 4 16 3 Q19 7 20 9 Q21 7 24 3 C31 4 36 12 35 22 C34 34 26 44 20 48 Z" fill={`url(#pg-${id})`} />
      <path d="M24 3 C31 4 36 12 35 22 C33 15 29 9 23 7 Z" fill="#ffffff" fillOpacity="0.85" />
      <path d="M20 46 C19 36 19 24 20 12" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  );
}

/** Valores fijos (no aleatorios) para que servidor y cliente rendericen lo mismo. */
const DRIFT = [
  { left: 4, size: 29, dur: 19, delay: -2, sway: 7, desktop: false },
  { left: 16, size: 39, dur: 24, delay: -14, sway: 9, desktop: true },
  { left: 27, size: 23, dur: 17, delay: -6, sway: 6, desktop: false },
  { left: 38, size: 34, dur: 22, delay: -18, sway: 8, desktop: true },
  { left: 49, size: 26, dur: 20, delay: -9, sway: 7, desktop: false },
  { left: 58, size: 44, dur: 27, delay: -3, sway: 10, desktop: true },
  { left: 68, size: 29, dur: 18, delay: -12, sway: 6, desktop: false },
  { left: 77, size: 36, dur: 23, delay: -20, sway: 9, desktop: true },
  { left: 86, size: 25, dur: 21, delay: -7, sway: 7, desktop: false },
  { left: 94, size: 34, dur: 25, delay: -16, sway: 8, desktop: true },
  { left: 22, size: 21, dur: 16, delay: -11, sway: 5, desktop: true },
  { left: 63, size: 22, dur: 15, delay: -1, sway: 5, desktop: true },
];

export function PetalDrift() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
      {DRIFT.map((p, i) => (
        <span
          key={i}
          className={`absolute top-0 ${p.desktop ? "hidden md:block" : "block"}`}
          style={{ left: `${p.left}%`, animation: `petal-fall ${p.dur}s linear ${p.delay}s infinite` }}
        >
          <span className="block opacity-80" style={{ animation: `petal-sway ${p.sway}s ease-in-out ${p.delay}s infinite alternate` }}>
            <Petal size={p.size} />
          </span>
        </span>
      ))}
    </div>
  );
}

/** Pétalos que flotan junto a un título. Colocar dentro de un contenedor `relative`. */
export function PetalCluster({ className = "", scale = 1 }: { className?: string; scale?: number }) {
  return (
    <span aria-hidden className={`pointer-events-none absolute ${className}`} style={{ width: 90 * scale, height: 80 * scale }}>
      <Petal size={36 * scale} className="absolute left-0 top-[30%]" style={{ animation: "petal-bob 6s ease-in-out infinite", ["--r" as string]: "-28deg" }} />
      <Petal size={28 * scale} className="absolute left-[46%] top-0" style={{ animation: "petal-bob 7.5s ease-in-out -2s infinite", ["--r" as string]: "34deg" }} />
      <Petal size={20 * scale} className="absolute bottom-0 right-0" style={{ animation: "petal-bob 5.5s ease-in-out -4s infinite", ["--r" as string]: "120deg" }} />
    </span>
  );
}
