/**
 * Logo oficial de Snap Slide (public/brand/logo.png, blanco sobre transparente).
 * Se usa como máscara: así el mismo archivo se pinta del color o degradado que pida cada fondo.
 */
interface LogoProps {
  className?: string;
  /** "dark" sobre fondos claros, "light" sobre fondos de color. */
  tone?: "dark" | "light";
  /** Se mantiene por compatibilidad: el logo oficial ya incluye el nombre. */
  showWordmark?: boolean;
}

const FILL = {
  // Celeste oscuro → celeste claro
  dark: "linear-gradient(115deg, #035e94 0%, #0096d6 45%, #3fd0ff 100%)",
  light: "#ffffff",
};

function maskStyle(tone: "dark" | "light"): React.CSSProperties {
  const mask = "url(/brand/logo.png) center / contain no-repeat";
  return { background: FILL[tone], mask, WebkitMask: mask };
}

export function LogoMark({ className = "h-8 w-8", tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return <span aria-hidden="true" className={`inline-block ${className}`} style={maskStyle(tone)} />;
}

export function Logo({ className = "", tone = "dark" }: LogoProps) {
  return (
    <span
      role="img"
      aria-label="Snap Slide"
      className={`inline-block h-10 aspect-[296/168] ${className}`}
      style={maskStyle(tone)}
    />
  );
}
