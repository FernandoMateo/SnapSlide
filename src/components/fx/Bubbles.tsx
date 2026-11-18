"use client";

/**
 * Burbujas de jabón que suben flotando por toda la página.
 * - `Bubble`: una burbuja (película transparente, borde tornasolado y brillo).
 * - `BubbleDrift`: capa fija con burbujas que suben, se mecen y "respiran" (solo CSS, sin JS por fotograma).
 */
import { useId } from "react";

export function Bubble({ size = 32, className = "", style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} style={style} aria-hidden>
      <defs>
        {/* Película: casi transparente en el centro, más densa hacia el borde */}
        <radialGradient id={`bf-${id}`} cx="0.45" cy="0.42" r="0.6">
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="0.85" stopColor="#bfe7ff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#5fbdf4" stopOpacity="0.4" />
        </radialGradient>
        {/* Reflejo tornasolado del jabón en el borde */}
        <linearGradient id={`br-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7fd8ff" />
          <stop offset="0.35" stopColor="#c9b8ff" />
          <stop offset="0.6" stopColor="#ffc6e8" />
          <stop offset="1" stopColor="#00bfff" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill={`url(#bf-${id})`} />
      <circle cx="50" cy="50" r="46" fill="none" stroke={`url(#br-${id})`} strokeWidth="2.2" strokeOpacity="0.85" />
      {/* Brillos */}
      <ellipse cx="34" cy="30" rx="13" ry="7.5" transform="rotate(-38 34 30)" fill="#ffffff" fillOpacity="0.9" />
      <circle cx="52" cy="20" r="3" fill="#ffffff" fillOpacity="0.75" />
      <path d="M72 78 A34 34 0 0 1 40 85" fill="none" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** Valores fijos (no aleatorios) para que servidor y cliente rendericen lo mismo. */
const DRIFT = [
  { left: 4, size: 30, dur: 19, delay: -2, sway: 7, desktop: false },
  { left: 16, size: 46, dur: 24, delay: -14, sway: 9, desktop: true },
  { left: 27, size: 20, dur: 15, delay: -6, sway: 5, desktop: false },
  { left: 38, size: 36, dur: 22, delay: -18, sway: 8, desktop: true },
  { left: 49, size: 26, dur: 18, delay: -9, sway: 6, desktop: false },
  { left: 58, size: 54, dur: 28, delay: -3, sway: 10, desktop: true },
  { left: 68, size: 28, dur: 17, delay: -12, sway: 6, desktop: false },
  { left: 77, size: 40, dur: 23, delay: -20, sway: 9, desktop: true },
  { left: 86, size: 22, dur: 16, delay: -7, sway: 5, desktop: false },
  { left: 94, size: 34, dur: 25, delay: -16, sway: 8, desktop: true },
  { left: 22, size: 16, dur: 13, delay: -11, sway: 4, desktop: true },
  { left: 63, size: 18, dur: 14, delay: -1, sway: 4, desktop: true },
  { left: 10, size: 24, dur: 17, delay: -13, sway: 6, desktop: false },
  { left: 44, size: 32, dur: 21, delay: -4, sway: 7, desktop: false },
  { left: 81, size: 18, dur: 14, delay: -10, sway: 4, desktop: false },
  { left: 33, size: 42, dur: 26, delay: -22, sway: 9, desktop: true },
  { left: 53, size: 14, dur: 12, delay: -8, sway: 4, desktop: true },
  { left: 72, size: 30, dur: 20, delay: -17, sway: 7, desktop: true },
  { left: 90, size: 48, dur: 27, delay: -11, sway: 10, desktop: true },
  { left: 1, size: 20, dur: 15, delay: -19, sway: 5, desktop: true },
];

export function BubbleDrift() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
      {DRIFT.map((b, i) => (
        <span
          key={i}
          className={`absolute top-0 ${b.desktop ? "hidden md:block" : "block"}`}
          style={{ left: `${b.left}%`, animation: `bubble-rise ${b.dur}s linear ${b.delay}s infinite` }}
        >
          <span className="block" style={{ animation: `bubble-sway ${b.sway}s ease-in-out ${b.delay}s infinite alternate` }}>
            <Bubble size={b.size} style={{ animation: `bubble-wobble ${3 + (i % 3)}s ease-in-out ${b.delay}s infinite` }} />
          </span>
        </span>
      ))}
    </div>
  );
}
