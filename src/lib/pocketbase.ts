/**
 * Cliente de PocketBase para cuando se reemplace el modo demo (src/lib/store.ts).
 * Las reglas de permisos viven en el servidor (pocketbase/pb_migrations); las operaciones
 * que tocan stock pasan por las rutas propias de pocketbase/pb_hooks para ser atómicas.
 */
import PocketBase from "pocketbase";
import type { MovementReason, SaleItem } from "./types";

export const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || "http://127.0.0.1:8090");
pb.autoCancellation(false);

export const snapApi = {
  login: (email: string, password: string) => pb.collection("users").authWithPassword(email, password),
  logout: () => pb.authStore.clear(),

  /** Crea la orden y descuenta stock FEFO en el servidor. Devuelve { id, number }. */
  createSale: (input: { client: string; items: Pick<SaleItem, "productId" | "quantity">[]; notes?: string }) =>
    pb.send<{ id: string; number: string }>("/api/snapslide/sales", { method: "POST", body: input }),

  /** Solo Owners. Entradas suman al lote (o lo crean); salidas restan. */
  recordMovement: (input: {
    productId: string;
    type: "in" | "out";
    reason: MovementReason;
    quantity: number;
    lotCode: string;
    expiresAt?: string;
    note?: string;
  }) => pb.send<{ id: string; lot: string; quantity: number }>("/api/snapslide/movements", { method: "POST", body: input }),

  /** El hook del servidor registra el cobro al pasar a pagada y lo anula al volver a pendiente. */
  setSaleStatus: (saleId: string, status: "pending" | "paid" | "shipped") => pb.collection("sales").update(saleId, { status }),
};
