"use client";

/**
 * Título que se "disuelve en agua", la premisa de la hoja Snap Slide.
 * Al entrar en pantalla, cada letra emerge de un velo líquido (onda SVG + desenfoque) mientras suben burbujas;
 * al salir, vuelve a disolverse. El texto completo queda en `aria-label`.
 */
import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";

type Tag = "h1" | "h2" | "h3" | "p";

interface WaterTitleProps {
  as?: Tag;
  /** Una entrada por línea. */
  lines: string[];
  className?: string;
  /** Clase extra por línea (p. ej. color de acento en la última). */
  lineClassName?: (index: number) => string;
  /** Si se pasa, controla la animación en lugar de la visibilidad en pantalla. */
  play?: boolean;
  delay?: number;
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function WaterTitle({ as = "h2", lines, className = "", lineClassName, play, delay = 0 }: WaterTitleProps) {
  const Tag = motion[as];
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const reduce = useReducedMotion();
  const active = play ?? inView;
  const id = useId().replace(/:/g, "");
  const disp = useRef<SVGFEDisplacementMapElement>(null);
  const turb = useRef<SVGFETurbulenceElement>(null);
  const [liquid, setLiquid] = useState(true);
  const [wave, setWave] = useState(0);

  // Onda líquida: fuerte mientras la letra emerge, desaparece al asentarse (y el filtro se quita para no afectar la nitidez).
  useEffect(() => {
    if (reduce) return;
    setLiquid(true);
    if (active) setWave((w) => w + 1);
    const ctrl = animate(active ? 46 : 0, active ? 0 : 46, {
      duration: active ? 1.5 : 0.7,
      delay: active ? delay : 0,
      ease: EASE,
      onUpdate: (v) => {
        disp.current?.setAttribute("scale", v.toFixed(2));
        turb.current?.setAttribute("baseFrequency", `0.012 ${(0.05 + v * 0.0012).toFixed(4)}`);
      },
      onComplete: () => active && setLiquid(false),
    });
    return () => ctrl.stop();
  }, [active, delay, reduce]);

  let n = 0;
  const words = lines.map((line) => line.split(" "));
  const text = lines.join(" ");
  const total = text.replace(/\s/g, "").length;

  return (
    <Tag ref={ref} aria-label={text} className={`relative ${className}`}>
      <svg aria-hidden width="0" height="0" className="absolute">
        <filter id={`water-${id}`} x="-10%" y="-30%" width="120%" height="160%">
          <feTurbulence ref={turb} type="fractalNoise" baseFrequency="0.012 0.05" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap ref={disp} in="SourceGraphic" in2="noise" scale="46" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <span aria-hidden className="block" style={{ filter: liquid && !reduce ? `url(#water-${id})` : undefined }}>
        {words.map((ws, li) => (
          <span key={li} className={`block ${lineClassName?.(li) ?? ""}`}>
            {ws.map((w, wi) => (
              <span key={wi} className="inline-block whitespace-nowrap">
                {[...w].map((ch) => {
                  const i = n++;
                  return (
                    <motion.span
                      key={i}
                      className="inline-block"
                      initial={reduce ? false : { opacity: 0, y: "0.32em", filter: "blur(14px)", scaleY: 1.18 }}
                      animate={
                        reduce || active
                          ? { opacity: 1, y: "0em", filter: "blur(0px)", scaleY: 1 }
                          : { opacity: 0, y: "0.32em", filter: "blur(14px)", scaleY: 1.18 }
                      }
                      transition={{ duration: active ? 1 : 0.55, ease: EASE, delay: active ? delay + i * 0.022 : (total - i) * 0.006 }}
                    >
                      {ch}
                    </motion.span>
                  );
                })}
                {wi < ws.length - 1 && <span className="inline-block">&nbsp;</span>}
              </span>
            ))}
          </span>
        ))}
      </span>
      {/* Burbujas que suben cuando el título emerge */}
      {!reduce && wave > 0 && (
        <span key={wave} aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-0">
          {[8, 22, 37, 51, 64, 79, 90].map((left, i) => (
            <span
              key={i}
              className="absolute bottom-0 rounded-full border border-sky/60 bg-sky/10"
              style={{
                left: `${left}%`,
                width: 6 + (i % 3) * 4,
                height: 6 + (i % 3) * 4,
                animation: `bubble-up ${1.3 + (i % 4) * 0.25}s ease-out ${delay + 0.1 + i * 0.09}s both`,
              }}
            />
          ))}
        </span>
      )}
    </Tag>
  );
}
