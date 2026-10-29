import type { Database, Movement } from "@/lib/types";
import type { LabelData } from "./LotLabel";

/** Datos de la etiqueta de un ingreso, a partir del movimiento y del lote actual. */
export function labelFor(db: Database, m: Pick<Movement, "productId" | "lotCode" | "quantity" | "date" | "reason" | "userId" | "note">, reasonLabel: string): LabelData | null {
  const p = db.products.find((x) => x.id === m.productId);
  if (!p) return null;
  const lot = p.lots.find((l) => l.code === m.lotCode);
  return {
    productName: p.name,
    presentation: p.presentation,
    sku: p.sku,
    lotCode: m.lotCode,
    quantity: m.quantity,
    receivedAt: m.date,
    expiresAt: lot?.expiresAt,
    reason: reasonLabel,
    receivedBy: db.users.find((u) => u.id === m.userId)?.name ?? "—",
    note: m.note,
  };
}
