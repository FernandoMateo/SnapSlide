"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Curva suave (Catmull-Rom → Bézier) que pasa por todos los puntos. */
function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

export interface LinePoint {
  label: string;
  value: number;
}

export function SmoothLineChart({
  data,
  height = 260,
  format,
  markers = [],
}: {
  data: LinePoint[];
  height?: number;
  format: (n: number) => string;
  /** Índices a marcar con una línea vertical (ej. 30/60/90 días). */
  markers?: { index: number; label: string }[];
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const reduce = useReducedMotion();
  const pad = { t: 16, r: 12, b: 28, l: 12 };

  const geo = useMemo(() => {
    if (!width || data.length < 2) return null;
    const values = data.map((p) => p.value);
    let min = Math.min(...values, 0);
    let max = Math.max(...values);
    const span = max - min || 1;
    min -= span * 0.08;
    max += span * 0.08;
    const w = width - pad.l - pad.r;
    const h = height - pad.t - pad.b;
    const x = (i: number) => pad.l + (i / (data.length - 1)) * w;
    const y = (v: number) => pad.t + (1 - (v - min) / (max - min)) * h;
    const pts = data.map((p, i) => [x(i), y(p.value)] as [number, number]);
    const line = smoothPath(pts);
    const area = `${line} L${x(data.length - 1)},${pad.t + h} L${x(0)},${pad.t + h} Z`;
    return { x, y, pts, line, area, zeroY: y(0), showZero: min < 0 };
  }, [width, data, height, pad.l, pad.r, pad.t, pad.b]);

  const onMove = (e: React.PointerEvent) => {
    if (!geo) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const rel = (e.clientX - rect.left - pad.l) / (rect.width - pad.l - pad.r);
    setHover(Math.max(0, Math.min(data.length - 1, Math.round(rel * (data.length - 1)))));
  };

  return (
    <div ref={ref} className="relative w-full touch-pan-y" style={{ height }} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
      {geo && (
        <svg width={width} height={height} className="overflow-visible">
          <defs>
            <linearGradient id="line-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0096D6" stopOpacity="0.3" />
              <stop offset="1" stopColor="#00BFFF" stopOpacity="0" />
            </linearGradient>
          </defs>
          {geo.showZero && <line x1={pad.l} x2={width - pad.r} y1={geo.zeroY} y2={geo.zeroY} stroke="#FF3B5C" strokeDasharray="4 4" strokeOpacity="0.5" />}
          {markers.map((m) => (
            <g key={m.index}>
              <line x1={geo.x(m.index)} x2={geo.x(m.index)} y1={pad.t} y2={height - pad.b} stroke="#E3EBF2" strokeDasharray="3 5" />
              <text x={geo.x(m.index)} y={height - 8} textAnchor={m.index === 0 ? "start" : m.index === data.length - 1 ? "end" : "middle"} className="fill-ink-faint text-[11px] font-bold">
                {m.label}
              </text>
            </g>
          ))}
          <motion.path d={geo.area} fill="url(#line-area)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} />
          <motion.path
            d={geo.line}
            fill="none"
            stroke="#00BFFF"
            strokeWidth={2.5}
            strokeLinecap="round"
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            style={{ filter: "drop-shadow(0 4px 10px rgba(0,191,255,0.45))" }}
          />
          {hover !== null && (
            <g>
              <line x1={geo.pts[hover][0]} x2={geo.pts[hover][0]} y1={pad.t} y2={height - pad.b} stroke="#0B1B2B" strokeOpacity="0.15" />
              <circle cx={geo.pts[hover][0]} cy={geo.pts[hover][1]} r={5} fill="#fff" stroke="#00BFFF" strokeWidth={2.5} />
            </g>
          )}
        </svg>
      )}
      {geo && hover !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-xl bg-ink px-3 py-2 text-xs text-white shadow-lg"
          style={{ left: Math.min(Math.max(geo.pts[hover][0], 70), width - 70) }}
        >
          <span className="block text-white/60">{data[hover].label}</span>
          <span className="tabular block text-sm font-bold">{format(data[hover].value)}</span>
        </div>
      )}
    </div>
  );
}

export function Sparkline({ values, className = "h-12 w-full", color = "#00BFFF" }: { values: number[]; className?: string; color?: string }) {
  const w = 200;
  const h = 48;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => [(i / Math.max(1, values.length - 1)) * w, h - (v / max) * (h - 6) - 3] as [number, number]);
  const line = smoothPath(pts);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className} aria-hidden>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={color} opacity="0.12" />
      <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
    </svg>
  );
}

/** Anillo de progreso hacia la meta mensual. */
export function GoalRing({ progress, size = 220, children }: { progress: number; size?: number; children?: React.ReactNode }) {
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(progress, 1);
  const over = progress > 1;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E6F8FF" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={over ? "#12B886" : "#00BFFF"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - clamped) }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: "drop-shadow(0 0 10px rgba(0,191,255,0.45))" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
