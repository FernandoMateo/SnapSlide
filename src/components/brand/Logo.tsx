/**
 * Logo provisional de Snap Slide: el isotipo es la hoja partida en la marca.
 * Reemplazar por el logo oficial (SVG) cuando esté disponible: mantener la API `<Logo />`.
 */
interface LogoProps {
  className?: string;
  /** "dark" sobre fondos claros, "light" sobre fondos de color. */
  tone?: "dark" | "light";
  showWordmark?: boolean;
}

export function LogoMark({ className = "h-8 w-8", tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  const a = tone === "light" ? "#FFFFFF" : "#00BFFF";
  const b = tone === "light" ? "rgba(255,255,255,0.78)" : "#0A3FBF";
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect x="7" y="6" width="12" height="28" rx="2.5" fill={a} />
      <rect x="21" y="6" width="12" height="28" rx="2.5" fill={b} transform="rotate(8 27 20)" />
    </svg>
  );
}

export function Logo({ className = "", tone = "dark", showWordmark = true }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark tone={tone} />
      {showWordmark && (
        <span
          className={`font-display text-[1.05rem] font-extrabold tracking-[0.18em] ${tone === "light" ? "text-white" : "text-ink"}`}
        >
          SNAP<span className={tone === "light" ? "text-white/80" : "text-sky"}>SLIDE</span>
        </span>
      )}
    </span>
  );
}
