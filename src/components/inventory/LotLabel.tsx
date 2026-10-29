"use client";

import JsBarcode from "jsbarcode";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Logo } from "@/components/brand/Logo";
import { Drawer } from "@/components/dashboard/ui";
import { useI18n } from "@/i18n/I18nProvider";

/** Datos de un ingreso de mercadería que van impresos en la etiqueta. */
export interface LabelData {
  productName: string;
  presentation: string;
  sku: string;
  lotCode: string;
  quantity: number;
  receivedAt: string;
  expiresAt?: string;
  reason: string;
  receivedBy: string;
  note?: string;
}

type Group = "thermal" | "brother" | "sheet";
interface LabelSize {
  id: string;
  name: string;
  group: Group;
  /** Medida de UNA etiqueta, en mm. */
  w: number;
  h: number;
  /** Hojas: página y grilla de etiquetas. */
  sheet?: { page: "letter" | "A4"; cols: number; rows: number; gapX: number; gapY: number; top: number; left: number };
}

const IN = 25.4;
export const LABEL_SIZES: LabelSize[] = [
  { id: "4x6", name: '4 × 6"', group: "thermal", w: 4 * IN, h: 6 * IN },
  { id: "4x3", name: '4 × 3"', group: "thermal", w: 4 * IN, h: 3 * IN },
  { id: "4x2", name: '4 × 2"', group: "thermal", w: 4 * IN, h: 2 * IN },
  { id: "3x2", name: '3 × 2"', group: "thermal", w: 3 * IN, h: 2 * IN },
  { id: "2.25x1.25", name: '2.25 × 1.25"', group: "thermal", w: 2.25 * IN, h: 1.25 * IN },
  { id: "2x1", name: '2 × 1"', group: "thermal", w: 2 * IN, h: 1 * IN },
  { id: "100x150", name: "100 × 150 mm", group: "thermal", w: 100, h: 150 },
  { id: "100x50", name: "100 × 50 mm", group: "thermal", w: 100, h: 50 },
  { id: "62x100", name: "62 × 100 mm (DK-11202)", group: "brother", w: 62, h: 100 },
  { id: "62x29", name: "62 × 29 mm (DK-11209)", group: "brother", w: 62, h: 29 },
  { id: "29x90", name: "29 × 90 mm (DK-11201)", group: "brother", w: 90, h: 29 },
  { id: "letter-6", name: 'Carta · 6 (4 × 3.33") Avery 5164', group: "sheet", w: 4 * IN, h: 3.33 * IN, sheet: { page: "letter", cols: 2, rows: 3, gapX: 0.19 * IN, gapY: 0, top: 0.5 * IN, left: 0.16 * IN } },
  { id: "letter-10", name: 'Carta · 10 (4 × 2") Avery 5163', group: "sheet", w: 4 * IN, h: 2 * IN, sheet: { page: "letter", cols: 2, rows: 5, gapX: 0.19 * IN, gapY: 0, top: 0.5 * IN, left: 0.16 * IN } },
  { id: "letter-30", name: 'Carta · 30 (2.63 × 1") Avery 5160', group: "sheet", w: 2.625 * IN, h: 1 * IN, sheet: { page: "letter", cols: 3, rows: 10, gapX: 0.125 * IN, gapY: 0, top: 0.5 * IN, left: 0.19 * IN } },
  { id: "a4-8", name: "A4 · 8 (99 × 68 mm) L7165", group: "sheet", w: 99.1, h: 67.7, sheet: { page: "A4", cols: 2, rows: 4, gapX: 2.5, gapY: 0, top: 13.1, left: 4.6 } },
];

const PAGE = { letter: { w: 8.5 * IN, h: 11 * IN }, A4: { w: 210, h: 297 } };
const STORAGE = "snapslide-label-size";

/** Código de barras CODE128 que se estira al ancho del contenedor sin deformar la proporción de las barras. */
function Barcode({ value, height }: { value: string; height: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = ref.current;
    if (!svg || !value) return;
    try {
      // margin = 10 módulos de zona silenciosa a cada lado, exigida por los lectores.
      JsBarcode(svg, value, { format: "CODE128", width: 2, height: 100, margin: 0, marginLeft: 20, marginRight: 20, displayValue: false, background: "#ffffff", lineColor: "#000000" });
      const w = svg.getAttribute("width");
      const h = svg.getAttribute("height");
      if (w && h) {
        svg.setAttribute("viewBox", `0 0 ${parseFloat(w)} ${parseFloat(h)}`);
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        svg.setAttribute("preserveAspectRatio", "none");
      }
    } catch {
      /* valor no codificable */
    }
  }, [value]);
  return <svg ref={ref} role="img" aria-label={value} style={{ width: "100%", height, flexShrink: 0, display: "block", shapeRendering: "crispEdges" }} />;
}

/** Una etiqueta. Todo se mide en mm para que la impresión sea exacta. */
export function LotLabel({ data, size }: { data: LabelData; size: LabelSize }) {
  const { d, date, num } = useI18n();
  const { w, h } = size;
  const tier = h >= 70 && w >= 55 ? "L" : h >= 40 ? "M" : "S";
  // Tamaño de letra base (mm) según el espacio de cada formato.
  const base = tier === "L" ? Math.min(w / 22, h / 26) : tier === "M" ? Math.max(2.4, Math.min(w / 28, h / 15)) : Math.max(2.1, Math.min(w / 20, h / 7));
  const pad = Math.max(1.6, Math.min(w, h) * 0.05);
  const field = (label: string, value: string) => (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: "0.62em", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.65 }}>{label}</div>
      <div style={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
    </div>
  );

  return (
    <div
      className="lot-label"
      style={{
        width: `${w}mm`,
        height: `${h}mm`,
        padding: `${pad}mm`,
        fontSize: `${base}mm`,
        lineHeight: 1.15,
        color: "#000",
        background: "#fff",
        fontFamily: "var(--font-sans), system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: `${pad * 0.55}mm`,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {tier !== "S" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1mm", borderBottom: "0.4mm solid #000", paddingBottom: `${pad * 0.4}mm` }}>
          <Logo tone="black" className={tier === "L" ? "!h-[2.1em]" : "!h-[1.7em]"} />
          <span style={{ fontSize: "0.7em", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}>{d.labels.lot}</span>
        </div>
      )}

      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: tier === "L" ? "1.35em" : "1.05em", fontWeight: 800, lineHeight: 1.05, whiteSpace: tier === "L" ? "normal" : "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{data.productName}</div>
        {tier === "L" && <div style={{ fontSize: "0.8em", marginTop: "0.4mm" }}>{data.presentation}</div>}
      </div>

      {tier === "L" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: `${pad * 0.5}mm ${pad}mm` }}>
          {field(d.labels.lot, data.lotCode)}
          {field(d.labels.qty, `${num(data.quantity)} ${d.common.units}`)}
          {field(d.labels.received, date(data.receivedAt))}
          {field(d.labels.expires, data.expiresAt ? date(data.expiresAt) : "—")}
          {field(d.labels.reason, data.reason)}
          {field(d.labels.by, data.receivedBy)}
        </div>
      )}
      {tier === "M" && (
        <div style={{ fontSize: "0.78em", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {num(data.quantity)} {d.common.units} · {d.labels.received} {date(data.receivedAt)}
          {data.expiresAt ? ` · ${d.labels.expires} ${date(data.expiresAt)}` : ""}
        </div>
      )}

      {/* Lote: el código principal */}
      <div style={{ marginTop: tier === "L" ? "auto" : 0, flex: tier === "L" ? undefined : 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <Barcode value={data.lotCode} height={tier === "L" ? `${Math.min(h * 0.19, 32)}mm` : tier === "M" ? `${Math.max(h * 0.2, 8)}mm` : `${Math.max(h * 0.42, 6)}mm`} />
        <div style={{ textAlign: "center", fontFamily: "ui-monospace, monospace", fontWeight: 800, fontSize: tier === "S" ? "0.9em" : "1.05em", letterSpacing: "0.12em", marginTop: "0.5mm" }}>
          {d.labels.lot} {data.lotCode}
        </div>
      </div>

      {tier !== "S" ? (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Barcode value={data.sku} height={tier === "L" ? `${Math.min(h * 0.08, 13)}mm` : `${Math.max(h * 0.1, 5)}mm`} />
          <div style={{ textAlign: "center", fontFamily: "ui-monospace, monospace", fontWeight: 700, fontSize: "0.78em", letterSpacing: "0.1em", marginTop: "0.4mm" }}>
            SKU {data.sku}
          </div>
        </div>
      ) : (
        <div style={{ fontSize: "0.72em", fontWeight: 700, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden" }}>
          SKU {data.sku}
          {data.expiresAt ? ` · ${d.labels.expires} ${date(data.expiresAt)}` : ""}
        </div>
      )}

      {tier === "L" && data.note && <div style={{ fontSize: "0.72em", borderTop: "0.3mm dashed #000", paddingTop: "1mm" }}>{d.labels.note}: {data.note}</div>}
    </div>
  );
}

/** Panel para elegir medida y copias, ver la etiqueta y mandarla a imprimir. */
export function LabelDialog({ data, onClose }: { data: LabelData | null; onClose: () => void }) {
  const { d } = useI18n();
  const [sizeId, setSizeId] = useState("4x6");
  const [copies, setCopies] = useState(1);
  const [printing, setPrinting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewW, setPreviewW] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE);
      if (saved && LABEL_SIZES.some((s) => s.id === saved)) setSizeId(saved);
    } catch {
      /* sin almacenamiento */
    }
  }, []);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setPreviewW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [data]);

  const size = LABEL_SIZES.find((s) => s.id === sizeId) ?? LABEL_SIZES[0];
  const pickSize = (id: string) => {
    setSizeId(id);
    try {
      localStorage.setItem(STORAGE, id);
    } catch {
      /* ignorar */
    }
  };

  // Vista previa: la etiqueta real (en mm) escalada al ancho disponible.
  const MM = 96 / 25.4;
  const scale = previewW ? Math.min(1, (previewW - 2) / (size.w * MM), 420 / (size.h * MM)) : 0;

  useEffect(() => {
    if (!printing) return;
    const done = () => setPrinting(false);
    window.addEventListener("afterprint", done);
    // Dos frames: los códigos de barras se dibujan antes de abrir el diálogo de impresión.
    const id = requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("afterprint", done);
    };
  }, [printing]);

  const groups: Group[] = ["thermal", "brother", "sheet"];

  return (
    <>
      <Drawer open={!!data} onClose={onClose} title={d.labels.title} wide>
        {data && (
          <div className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
              <div>
                <label className="label" htmlFor="label-size">{d.labels.size}</label>
                <select id="label-size" className="field" value={sizeId} onChange={(e) => pickSize(e.target.value)}>
                  {groups.map((g) => (
                    <optgroup key={g} label={d.labels.groups[g]}>
                      {LABEL_SIZES.filter((s) => s.group === g).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                          {s.sheet ? ` · ${s.sheet.cols * s.sheet.rows} ${d.labels.perSheet}` : ""}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="label-copies">{d.labels.copies}</label>
                <input id="label-copies" type="number" min={1} max={200} inputMode="numeric" className="field tabular" value={copies} onChange={(e) => setCopies(Math.max(1, Math.min(200, Math.floor(Number(e.target.value)) || 1)))} />
              </div>
            </div>

            <div>
              <p className="label">{d.labels.preview}</p>
              <div ref={previewRef} className="grid place-items-center overflow-hidden rounded-2xl bg-[repeating-linear-gradient(45deg,#eef3f7,#eef3f7_10px,#f6f9fb_10px,#f6f9fb_20px)] p-4" style={{ minHeight: 160 }}>
                {scale > 0 && (
                  <div style={{ width: size.w * MM * scale, height: size.h * MM * scale }}>
                    <div className="shadow-[0_12px_30px_-12px_rgba(3,40,80,0.45)]" style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: `${size.w}mm`, height: `${size.h}mm` }}>
                      <LotLabel data={data} size={size} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-ink-faint">{d.labels.hint}</p>
            <button onClick={() => setPrinting(true)} className="btn btn-primary h-12 text-sm">
              🖨 {d.labels.print} · {copies}
            </button>
          </div>
        )}
      </Drawer>
      {printing && data && <PrintSheet data={data} size={size} copies={copies} />}
    </>
  );
}

/** Lo que realmente se imprime: fuera de la app, con @page a la medida elegida. */
function PrintSheet({ data, size, copies }: { data: LabelData; size: LabelSize; copies: number }) {
  const pages = useMemo(() => {
    if (!size.sheet) return Array.from({ length: copies }, () => 1);
    const per = size.sheet.cols * size.sheet.rows;
    return Array.from({ length: Math.ceil(copies / per) }, (_, i) => Math.min(per, copies - i * per));
  }, [size, copies]);

  const page = size.sheet ? PAGE[size.sheet.page] : { w: size.w, h: size.h };
  const css = `
    @page { size: ${page.w}mm ${page.h}mm; margin: 0; }
    @media screen { #label-print-root { position: fixed; left: -10000px; top: 0; } }
    @media print {
      html, body { background: #fff !important; }
      body > *:not(#label-print-root) { display: none !important; }
      #label-print-root { display: block !important; }
      .label-page { width: ${page.w}mm; height: ${page.h}mm; overflow: hidden; break-after: page; page-break-after: always; position: relative; }
      .label-page:last-child { break-after: auto; page-break-after: auto; }
      #label-print-root * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }`;

  return createPortal(
    <div id="label-print-root">
      <style>{css}</style>
      {pages.map((count, p) => (
        <div key={p} className="label-page">
          {size.sheet ? (
            <div
              style={{
                position: "absolute",
                top: `${size.sheet.top}mm`,
                left: `${size.sheet.left}mm`,
                display: "grid",
                gridTemplateColumns: `repeat(${size.sheet.cols}, ${size.w}mm)`,
                gridAutoRows: `${size.h}mm`,
                columnGap: `${size.sheet.gapX}mm`,
                rowGap: `${size.sheet.gapY}mm`,
              }}
            >
              {Array.from({ length: count }, (_, i) => (
                <LotLabel key={i} data={data} size={size} />
              ))}
            </div>
          ) : (
            <LotLabel data={data} size={size} />
          )}
        </div>
      ))}
    </div>,
    document.body,
  );
}
