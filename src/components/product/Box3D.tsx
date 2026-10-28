"use client";

/**
 * La caja Snap Slide en CSS 3D, con el frente real (fotografía enderezada en public/products/box-*.jpg).
 * Todo se controla con MotionValues, así el mismo modelo sirve para la historia con scroll y para el estudio interactivo.
 *
 * Proporciones tomadas de la caja real: frente 280 × 380, fondo ≈ 0.36 del ancho.
 * La pestaña perforada del frente (franja superior + diagonal derecha) viaja con la tapa al abrir.
 */
import { motion, useMotionTemplate, useTransform, type MotionValue } from "framer-motion";
import { SheetCard } from "@/components/landing/SheetCard";

export type ScentId = "original" | "floral";

export const SCENTS: Record<ScentId, { name: string; front: string; side: string; top: string; glow: string; ink: string; perforated?: boolean }> = {
  original: {
    name: "Original Soft Sent",
    front: "/products/box-original.webp",
    side: "linear-gradient(180deg,#a95ee0 0%,#d4709f 45%,#f7884a 100%)",
    top: "linear-gradient(90deg,#8f55f0 0%,#c070b0 50%,#ff8c3a 100%)",
    glow: "#ff8a4c",
    ink: "#7a2a4a",
    perforated: true,
  },
  floral: {
    name: "Floral Fantasy",
    front: "/products/box-floral.webp",
    side: "linear-gradient(180deg,#5f9ccb 0%,#3f84bb 45%,#2f6ea5 100%)",
    top: "linear-gradient(90deg,#9fc3dc 0%,#619cc4 35%,#2c78b2 70%,#2878b5 100%)",
    glow: "#3aa0ff",
    ink: "#1f4f80",
    perforated: true,
  },
};

/** Pestaña perforada sobre el frente, en coordenadas de la caja real (280 × 380). */
const STRIP: [number, number][] = [[0, 0], [280, 0], [280, 64], [218, 42], [0, 40]];
const BODY: [number, number][] = [[0, 40], [218, 42], [280, 64], [280, 380], [0, 380]];
const poly = (pts: [number, number][]) => `polygon(${pts.map(([x, y]) => `${(x / 280) * 100}% ${(y / 380) * 100}%`).join(",")})`;
const mirror = (pts: [number, number][]) => pts.map(([x, y]) => [280 - x, y] as [number, number]);

const CARDBOARD = "linear-gradient(180deg,#f7f1e6,#e6dac6)";
const SHEETS = 7;

interface Box3DProps {
  width: number;
  rx: MotionValue<number>;
  ry: MotionValue<number>;
  /** 0 cerrada → 1 tapa abierta. */
  open: MotionValue<number>;
  /** 0 hojas guardadas → 1 hojas en abanico sobre la caja. */
  lift: MotionValue<number>;
  /** 0 Original → 1 Floral (fundido de texturas). */
  floral: MotionValue<number>;
  /** Caja que nunca se abre (home, comparación de aromas): sin interior ni hojas y con un solo arte; menos DOM. */
  simple?: ScentId;
  className?: string;
}

export function Box3D({ width: W, rx, ry, open, lift, floral, simple, className = "" }: Box3DProps) {
  const H = (W * 380) / 280;
  const D = Math.round(W * 0.36);
  const transform = useMotionTemplate`rotateX(${rx}deg) rotateY(${ry}deg)`;
  const lid = useTransform(open, (v) => `translateZ(${-D / 2}px) rotateX(${v * 116}deg)`);

  const face = (w: number, h: number, t: string): React.CSSProperties => ({
    position: "absolute",
    left: (W - w) / 2,
    top: (H - h) / 2,
    width: w,
    height: h,
    transform: t,
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
  });

  return (
    <div className={`relative ${className}`} style={{ width: W, height: H, transformStyle: "preserve-3d", fontSize: W / 28 }}>
      <motion.div className="absolute inset-0" style={{ transform, transformStyle: "preserve-3d" }}>
        {!simple && (
          <>
        {/* ── Interior (cartón) ── */}
        <div style={{ ...face(W, H, `translateZ(${-D / 2 + 1}px)`), background: CARDBOARD }} />
        <div style={{ ...face(W, H, `translateZ(${D / 2 - 1}px) rotateY(180deg)`), background: CARDBOARD, clipPath: poly(mirror(BODY)) }} />
        <div style={{ ...face(D, H, `rotateY(-90deg) translateZ(${-(W / 2 - 1)}px)`), background: CARDBOARD }} />
        <div style={{ ...face(D, H, `rotateY(90deg) translateZ(${-(W / 2 - 1)}px)`), background: CARDBOARD }} />
        <div style={{ ...face(W, D, `rotateX(90deg) translateZ(${-(H / 2 - 1)}px)`), background: "#d9ccb6" }} />

        {/* ── Hojas dentro de la caja ── */}
        {Array.from({ length: SHEETS }, (_, i) => (
          <InnerSheet key={i} index={i} W={W} D={D} lift={lift} />
        ))}
          </>
        )}

        {/* ── Exterior ── */}
        <Face style={face(W, H, `translateZ(${D / 2}px)`)} clip={simple ? undefined : poly(BODY)} ry={ry} yaw={0}>
          <Art floral={floral} fixed={simple} kind="front" />
          <Gloss ry={ry} />
        </Face>
        <Face style={face(W, H, `rotateY(180deg) translateZ(${D / 2}px)`)} ry={ry} yaw={180}>
          <Art floral={floral} fixed={simple} kind="back" />
        </Face>
        <Face style={face(D, H, `rotateY(90deg) translateZ(${W / 2}px)`)} ry={ry} yaw={90}>
          <Art floral={floral} fixed={simple} kind="side" />
        </Face>
        <Face style={face(D, H, `rotateY(-90deg) translateZ(${W / 2}px)`)} ry={ry} yaw={-90}>
          <Art floral={floral} fixed={simple} kind="side" />
        </Face>
        <Face style={face(W, D, `rotateX(-90deg) translateZ(${H / 2}px)`)} ry={ry} yaw={0} dim={0.35}>
          <Art floral={floral} fixed={simple} kind="top" />
        </Face>
        {simple && (
          <div style={face(W, D, `rotateX(90deg) translateZ(${H / 2}px)`)}>
            <Art floral={floral} fixed={simple} kind="top" />
          </div>
        )}

        {/* ── Tapa: cara superior + pestaña perforada, con bisagra en la arista trasera ── */}
        {!simple && (
        <motion.div className="absolute left-0 top-0" style={{ width: W, height: 0, transform: lid, transformOrigin: "50% 0 0", transformStyle: "preserve-3d" }}>
          <div style={{ ...face(W, D, "rotateX(90deg)"), left: 0, top: 0, transformOrigin: "50% 0" }}>
            <Art floral={floral} kind="top" />
          </div>
          <div style={{ ...face(W, D, "rotateX(90deg) translateZ(-1px) rotateY(180deg)"), left: 0, top: 0, transformOrigin: "50% 0", background: CARDBOARD }} />
          <div style={{ ...face(W, H, `translateZ(${D}px)`), left: 0, top: 0, clipPath: poly(STRIP) }}>
            <Art floral={floral} kind="front" />
            <Gloss ry={ry} />
          </div>
          <div style={{ ...face(W, H, `translateZ(${D - 1}px) rotateY(180deg)`), left: 0, top: 0, clipPath: poly(mirror(STRIP)), background: CARDBOARD }} />
        </motion.div>
        )}
      </motion.div>
    </div>
  );
}

/** Cara exterior con sombreado según el ángulo frente a la luz (arriba a la izquierda). */
function Face({ style, clip, ry, yaw, dim = 0, children }: { style: React.CSSProperties; clip?: string; ry: MotionValue<number>; yaw: number; dim?: number; children: React.ReactNode }) {
  const shade = useTransform(ry, (v) => {
    const dot = Math.cos(((v + yaw + 28) * Math.PI) / 180);
    return Math.min(0.62, dim + 0.04 + 0.5 * (1 - Math.max(0, dot)));
  });
  return (
    <div style={{ ...style, clipPath: clip, overflow: "hidden" }}>
      {children}
      <motion.div className="pointer-events-none absolute inset-0 bg-[#1a0f2e]" style={{ opacity: shade }} />
    </div>
  );
}

/** Reflejo del cartón plastificado: se desliza al girar la caja. */
function Gloss({ ry }: { ry: MotionValue<number> }) {
  const pos = useTransform(ry, (v) => `${50 - v * 1.6}% 0%`);
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 mix-blend-soft-light"
      style={{
        backgroundImage: "linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.75) 50%, transparent 62%)",
        backgroundSize: "320% 100%",
        backgroundPosition: pos,
      }}
    />
  );
}

/** Arte de cada cara para ambos aromas; el floral se funde encima según `floral`. */
function Art({ floral, fixed, kind }: { floral: MotionValue<number>; fixed?: ScentId; kind: "front" | "back" | "side" | "top" }) {
  if (fixed) return <ArtLayer scent={fixed} kind={kind} />;
  return (
    <>
      <ArtLayer scent="original" kind={kind} />
      <motion.div className="absolute inset-0" style={{ opacity: floral }}>
        <ArtLayer scent="floral" kind={kind} />
      </motion.div>
    </>
  );
}

function ArtLayer({ scent, kind }: { scent: ScentId; kind: "front" | "back" | "side" | "top" }) {
  const s = SCENTS[scent];
  if (kind === "front") {
    return (
      <div className="absolute inset-0" style={{ backgroundImage: `url(${s.front})`, backgroundSize: "100% 100%" }}>
        {s.perforated && (
          <svg viewBox="0 0 280 380" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
            <path d="M0 40 L218 42 L280 64" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.9" strokeDasharray="5 3" />
          </svg>
        )}
      </div>
    );
  }
  if (kind === "side") {
    return (
      <div className="absolute inset-0 flex items-center justify-center" style={{ background: s.side }}>
        <span className="flex rotate-90 items-center gap-[0.8em] whitespace-nowrap font-display text-[1.05em] font-extrabold uppercase tracking-[0.28em] text-white/90">
          Laundry Detergent Sheets
          <span className="h-[0.35em] w-[0.35em] rounded-full bg-white/80" />
          32 · 64
        </span>
      </div>
    );
  }
  if (kind === "top") {
    return (
      <div className="absolute inset-0 flex items-center justify-between px-[1.4em]" style={{ background: s.top }}>
        <span className="font-display text-[0.95em] font-extrabold uppercase leading-tight tracking-[0.12em] text-white">
          32 sheets
          <br />
          64 loads
        </span>
        <span className="h-[2.6em] aspect-[296/168]" style={{ background: "#fff", mask: "url(/brand/logo.png) center / contain no-repeat", WebkitMask: "url(/brand/logo.png) center / contain no-repeat" }} />
      </div>
    );
  }
  // Reverso: instrucciones de uso de la hoja (1 hoja = 2 lavados).
  return (
    <div className="absolute inset-0 flex flex-col items-center px-[1.8em] pb-[2em] pt-[2.6em] text-white" style={{ background: s.side }}>
      <span className="h-[6em] aspect-[296/168]" style={{ background: "#fff", mask: "url(/brand/logo.png) center / contain no-repeat", WebkitMask: "url(/brand/logo.png) center / contain no-repeat" }} />
      <p className="mt-[1.4em] font-display text-[1.25em] font-extrabold uppercase tracking-[0.18em]">How to use</p>
      <ol className="mt-[1.2em] grid w-full gap-[0.9em]">
        {[
          ["1", "One sheet · two loads"],
          ["½", "Tear at the line for a small load"],
          ["→", "Toss it in the drum, then add clothes"],
        ].map(([n, text]) => (
          <li key={text} className="flex items-center gap-[0.8em] rounded-[0.9em] bg-white/18 px-[0.9em] py-[0.7em] text-[0.95em] font-semibold leading-tight backdrop-blur-[1px]" style={{ backgroundColor: "rgba(255,255,255,0.18)" }}>
            <span className="grid h-[2em] w-[2em] shrink-0 place-items-center rounded-full bg-white font-display font-extrabold" style={{ color: s.ink }}>
              {n}
            </span>
            {text}
          </li>
        ))}
      </ol>
      <div className="mt-auto flex w-full items-end justify-between text-[0.7em] font-bold uppercase tracking-[0.2em] text-white/85">
        <span>Eco friendly · Cruelty free</span>
        <span>Miami, FL</span>
      </div>
    </div>
  );
}

/** Hoja guardada de pie dentro de la caja; con `lift` sube y se abre en abanico. */
function InnerSheet({ index, W, D, lift }: { index: number; W: number; D: number; lift: MotionValue<number> }) {
  const w = W * 0.86;
  const h = (w * 2) / 3;
  const z = D / 2 - 7 - (index * (D - 14)) / (SHEETS - 1);
  const start = index * 0.07;
  const span = 1 - 0.07 * (SHEETS - 1);
  const fan = index - (SHEETS - 1) / 2;
  const t = useTransform(lift, (v) => Math.min(1, Math.max(0, (v - start) / span)));
  const transform = useTransform(t, (p) => {
    const e = 1 - Math.pow(1 - p, 3);
    return `translate3d(${fan * W * 0.035 * e}px, ${-e * W * (0.95 + Math.abs(fan) * -0.06)}px, ${z + e * (D * 0.35 - index * 2)}px) rotateZ(${fan * 4.5 * e}deg) rotateX(${-6 * e}deg)`;
  });
  return (
    <motion.div className="absolute" style={{ left: (W - w) / 2, top: 10, width: w, height: h, transform, transformOrigin: "50% 100%" }}>
      <SheetCard className="h-full w-full" showBrand={index === 0} showMarks />
    </motion.div>
  );
}
