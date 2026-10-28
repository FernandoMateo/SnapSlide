/** Hoja de detergente Snap: rectángulo blanco con la marca de corte al centro. */
export function SheetCard({
  className = "",
  style,
  showBrand = true,
  showMarks = true,
}: {
  className?: string;
  style?: React.CSSProperties;
  showBrand?: boolean;
  /** Muescas de corte arriba y abajo de la marca. */
  showMarks?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[12px] ${className}`}
      style={{
        aspectRatio: "3 / 2",
        backgroundImage: "linear-gradient(155deg, #ffffff 0%, #f4fbff 55%, #e4f5fe 100%)",
        boxShadow: "0 40px 70px -30px rgba(10,63,191,0.45), 0 0 0 1px rgba(0,191,255,0.12), 0 1px 0 #fff inset",
        ...style,
      }}
    >
      <span className="absolute inset-0 opacity-50 [background-image:repeating-linear-gradient(90deg,transparent_0_7px,rgba(0,191,255,0.05)_7px_8px)]" />
      <span className="absolute inset-y-[7%] left-1/2 -translate-x-1/2 border-l-2 border-dashed border-sky/45" />
      {showMarks && (
        <>
          <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] bg-sky" />
          <span className="absolute bottom-0 left-1/2 h-2.5 w-2.5 -translate-x-1/2 translate-y-1/2 rotate-45 rounded-[2px] bg-sky" />
        </>
      )}
      {showBrand && (
        <>
          <span className="absolute right-[56%] top-1/2 -translate-y-1/2 font-display text-[0.7em] font-extrabold tracking-[0.2em] text-sky/30">SNAP</span>
          <span className="absolute left-[56%] top-1/2 -translate-y-1/2 font-display text-[0.7em] font-extrabold tracking-[0.2em] text-sky/30">SLIDE</span>
        </>
      )}
    </div>
  );
}
