"use client";

import { useEffect, useState } from "react";

/** Ancho de la caja según el viewport: que caja + abanico de hojas quepan siempre en pantalla. */
export function useBoxWidth({ vw, vh, max }: { vw: number; vh: number; max: number }) {
  const [w, setW] = useState(max * 0.8);
  useEffect(() => {
    const update = () => setW(Math.round(Math.min(window.innerWidth * vw, window.innerHeight * vh, max)));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [vw, vh, max]);
  return w;
}
