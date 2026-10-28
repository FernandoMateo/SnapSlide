/** Destello de cuatro puntas, el mismo motivo que acompaña al logo en la caja. */
export function Sparkle({ size = 16, className = "", style }: { size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} style={style} aria-hidden>
      <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" fill="currentColor" />
    </svg>
  );
}
