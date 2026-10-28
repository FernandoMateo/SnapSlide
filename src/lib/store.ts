"use client";

/**
 * Estado global de la app (Zustand + localStorage).
 * Simula el backend: cada acción valida permisos igual que lo hará la API real,
 * para que la UI nunca dependa de "esconder botones" como única protección.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { can, canEditSale, consumeFEFO, productStock, saleTotal } from "./business";
import { addDays, today } from "./dates";
import type { Client, Movement, MovementReason, PaymentMethod, Product, Sale, SaleItem, SaleStatus, User } from "./types";
import { createMockDatabase, type Database } from "@/mocks";

type Result = { ok: true; id?: string } | { ok: false; error: string };

interface AppState {
  db: Database;
  sessionUserId: string | null;
  hydrated: boolean;

  login: (email: string, password: string) => Result;
  logout: () => void;
  resetDemo: () => void;

  saveProduct: (product: Product) => Result;
  recordMovement: (input: {
    productId: string;
    type: "in" | "out";
    reason: MovementReason;
    quantity: number;
    lotCode: string;
    expiresAt?: string;
    note?: string;
  }) => Result;

  createSale: (input: { clientId: string; items: SaleItem[]; notes?: string }) => Result;
  setSaleStatus: (saleId: string, status: SaleStatus, method?: PaymentMethod) => Result;

  saveClient: (client: Client) => Result;
}

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

export const useStore = create<AppState>()(
  persist(
    (set, get) => {
      const currentUser = (): User | undefined => get().db.users.find((u) => u.id === get().sessionUserId);

      return {
        db: createMockDatabase(),
        sessionUserId: null,
        hydrated: false,

        login(email, password) {
          const user = get().db.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
          if (!user || user.password !== password) return { ok: false, error: "auth.invalid" };
          set({ sessionUserId: user.id });
          return { ok: true, id: user.id };
        },

        logout() {
          set({ sessionUserId: null });
        },

        resetDemo() {
          set({ db: createMockDatabase() });
        },

        saveProduct(product) {
          if (!can(currentUser(), "products.edit")) return { ok: false, error: "perm.denied" };
          const { products } = get().db;
          if (products.some((p) => p.sku === product.sku && p.id !== product.id)) return { ok: false, error: "products.skuTaken" };
          const exists = products.some((p) => p.id === product.id);
          const next = exists ? products.map((p) => (p.id === product.id ? product : p)) : [...products, { ...product, id: product.id || uid("p") }];
          set({ db: { ...get().db, products: next } });
          return { ok: true, id: product.id };
        },

        recordMovement({ productId, type, reason, quantity, lotCode, expiresAt, note }) {
          const user = currentUser();
          if (!can(user, "inventory.manage")) return { ok: false, error: "perm.denied" };
          if (!Number.isFinite(quantity) || quantity <= 0) return { ok: false, error: "inventory.badQty" };
          const { db } = get();
          const product = db.products.find((p) => p.id === productId);
          if (!product) return { ok: false, error: "inventory.noProduct" };

          let lots = product.lots.map((l) => ({ ...l }));
          const lot = lots.find((l) => l.code === lotCode);
          if (type === "in") {
            if (lot) lot.quantity += quantity;
            else lots.push({ id: uid("l"), code: lotCode, quantity, expiresAt: expiresAt || addDays(today(), 365), receivedAt: today() });
          } else {
            if (!lot || lot.quantity < quantity) return { ok: false, error: "inventory.insufficient" };
            lot.quantity -= quantity;
          }
          lots = lots.filter((l) => l.quantity > 0 || l.code === lotCode);

          const movement: Movement = { id: uid("m"), productId, lotCode, type, reason, quantity, date: today(), userId: user!.id, note };
          set({
            db: {
              ...db,
              products: db.products.map((p) => (p.id === productId ? { ...p, lots } : p)),
              movements: [movement, ...db.movements],
            },
          });
          return { ok: true, id: movement.id };
        },

        createSale({ clientId, items, notes }) {
          const user = currentUser();
          if (!user) return { ok: false, error: "perm.denied" };
          const { db } = get();
          const client = db.clients.find((c) => c.id === clientId);
          if (!client) return { ok: false, error: "sales.noClient" };
          if (!items.length) return { ok: false, error: "sales.emptyCart" };

          // Validación de stock antes de tocar nada (todo o nada).
          for (const it of items) {
            const p = db.products.find((x) => x.id === it.productId);
            if (!p || productStock(p) < it.quantity) return { ok: false, error: "sales.noStock" };
          }

          const saleId = uid("s");
          const movements: Movement[] = [];
          const products = db.products.map((p) => {
            const line = items.find((it) => it.productId === p.id);
            if (!line) return p;
            const { lots, taken } = consumeFEFO(p, line.quantity);
            taken.forEach((tk) =>
              movements.push({ id: uid("m"), productId: p.id, lotCode: tk.lotCode, type: "sale", reason: "sale", quantity: tk.quantity, date: today(), userId: user.id, note: saleId }),
            );
            return { ...p, lots };
          });

          const nextNumber = 1001 + db.sales.length;
          const sale: Sale = {
            id: saleId,
            number: `SO-${nextNumber}`,
            clientId,
            // Un vendedor siempre firma sus órdenes; un Owner las registra a nombre del vendedor de la cuenta.
            sellerId: user.role === "seller" ? user.id : client.sellerId,
            date: today(),
            dueDate: addDays(today(), client.paymentTerms),
            items,
            status: "pending",
            notes,
          };

          set({ db: { ...db, products, sales: [...db.sales, sale], movements: [...movements, ...db.movements] } });
          return { ok: true, id: sale.number };
        },

        setSaleStatus(saleId, status, method = "transfer") {
          const user = currentUser();
          const { db } = get();
          const sale = db.sales.find((s) => s.id === saleId);
          if (!user || !sale || !canEditSale(user, sale)) return { ok: false, error: "perm.denied" };

          let payments = db.payments;
          let paidAt = sale.paidAt;
          if (status !== "pending" && !sale.paidAt) {
            paidAt = today();
            payments = [...payments, { id: uid("pay"), saleId, clientId: sale.clientId, amount: saleTotal(sale), date: paidAt, method }];
          }
          if (status === "pending") {
            paidAt = undefined;
            payments = payments.filter((p) => p.saleId !== saleId);
          }
          set({ db: { ...db, payments, sales: db.sales.map((s) => (s.id === saleId ? { ...s, status, paidAt } : s)) } });
          return { ok: true };
        },

        saveClient(client) {
          if (!can(currentUser(), "clients.edit")) return { ok: false, error: "perm.denied" };
          const { clients } = get().db;
          const exists = clients.some((c) => c.id === client.id);
          const next = exists ? clients.map((c) => (c.id === client.id ? client : c)) : [...clients, { ...client, id: uid("c"), createdAt: today() }];
          set({ db: { ...get().db, clients: next } });
          return { ok: true };
        },
      };
    },
    {
      // Subir la versión al cambiar la forma de los mocks para no cargar datos viejos del navegador.
      name: "snapslide-demo-v2",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ db: s.db, sessionUserId: s.sessionUserId }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
        useStore.setState({ hydrated: true });
      },
    },
  ),
);

export function useCurrentUser(): User | null {
  return useStore((s) => s.db.users.find((u) => u.id === s.sessionUserId) ?? null);
}
