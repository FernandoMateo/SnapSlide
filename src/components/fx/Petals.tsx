"use client";

/**
 * Pétalos celestes, el mismo motivo que acompaña a la caja Floral Fantasy.
 * - `Petal`: un pétalo suelto.
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
