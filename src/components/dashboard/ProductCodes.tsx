"use client";

import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";

/** Genera el QR y el código de barras (CODE128) de un SKU, con descarga. */
export function ProductCodes({ sku, name }: { sku: string; name: string }) {
  const { d } = useI18n();
  const [qr, setQr] = useState<string>("");
  const barRef = useRef<SVGSVGElement>(null);
  const value = sku.trim();

  useEffect(() => {
    if (!value) {
      setQr("");
      return;
    }
    QRCode.toDataURL(value, { margin: 1, width: 360, color: { dark: "#0B1B2B", light: "#FFFFFF" } })
      .then(setQr)
      .catch(() => setQr(""));
    if (barRef.current) {
      try {
        JsBarcode(barRef.current, value, { format: "CODE128", lineColor: "#0B1B2B", height: 70, width: 2, fontSize: 14, margin: 8, font: "monospace" });
      } catch {
        /* SKU con caracteres no válidos para CODE128 */
      }
    }
  }, [value]);

  const downloadBarcode = () => {
    if (!barRef.current) return;
    const blob = new Blob([new XMLSerializer().serializeToString(barRef.current)], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${value}-barcode.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!value) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
      <figure className="rounded-2xl border border-line bg-white p-3 text-center">
        {qr && <img src={qr} alt={`${d.products.qr} ${name}`} className="mx-auto h-32 w-32" />}
        <figcaption className="mt-2 flex items-center justify-between gap-2 text-xs font-bold text-ink-faint">
          {d.products.qr}
          {qr && (
            <a href={qr} download={`${value}-qr.png`} className="text-sky-deep hover:underline">
              {d.products.download}
            </a>
          )}
        </figcaption>
      </figure>
      <figure className="flex flex-col rounded-2xl border border-line bg-white p-3">
        <div className="grid flex-1 place-items-center overflow-hidden">
          <svg ref={barRef} className="max-w-full" role="img" aria-label={`${d.products.barcode} ${value}`} />
        </div>
        <figcaption className="mt-2 flex items-center justify-between text-xs font-bold text-ink-faint">
          {d.products.barcode}
          <button type="button" onClick={downloadBarcode} className="text-sky-deep hover:underline">
            {d.products.download}
          </button>
        </figcaption>
      </figure>
    </div>
  );
}
