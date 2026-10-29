"use client";

/**
 * Estado de la app en el navegador (Zustand). Los datos viven en el servidor:
 * aquí solo hay una copia de lo que el usuario puede ver, y cada acción viaja a /api/action,
 * que valida permisos y reglas y devuelve la copia actualizada.
 */
import { create } from "zustand";
import type { Action, Result, UserInput } from "./engine";
import type { Client, Database, MovementReason, PaymentMethod, Product, Role, SaleItem, SaleStatus, User } from "./types";

export type { Result };

const EMPTY: Database = { users: [], products: [], clients: [], sales: [], payments: [], movements: [], expenses: [] };

interface AppState {
  db: Database;
  me: User | null;
  /** Ya se consultó la sesión al servidor (haya o no usuario). */
  hydrated: boolean;

  bootstrap: (force?: boolean) => Promise<void>;
  login: (email: string, password: string) => Promise<Result & { role?: Role }>;
  logout: () => Promise<void>;
  changePassword: (current: string, next: string) => Promise<Result>;

  act: (action: Action, extra?: { password?: string }) => Promise<Result>;
  saveProduct: (product: Product) => Promise<Result>;
  recordMovement: (input: { productId: string; type: "in" | "out"; reason: MovementReason; quantity: number; lotCode: string; expiresAt?: string; note?: string }) => Promise<Result>;
  createSale: (input: { clientId: string; items: SaleItem[]; notes?: string }) => Promise<Result>;
  setSaleStatus: (saleId: string, status: SaleStatus, method?: PaymentMethod) => Promise<Result>;
  saveClient: (client: Client) => Promise<Result>;
  saveUser: (user: UserInput, password?: string) => Promise<Result>;
  updateProfile: (patch: { name?: string; phone?: string }) => Promise<Result>;
  clearDemoData: () => Promise<Result>;
}

let inflight: Promise<void> | null = null;

async function post<T>(url: string, body: unknown): Promise<{ status: number; data: T }> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
  return { status: res.status, data: (await res.json().catch(() => ({}))) as T };
}

export const useStore = create<AppState>()((set, get) => ({
  db: EMPTY,
  me: null,
  hydrated: false,

  bootstrap(force) {
    if (inflight && !force) return inflight;
    inflight = (async () => {
      try {
        const res = await fetch("/api/data", { cache: "no-store" });
        const data = (await res.json()) as { me: User | null; db?: Database };
        set({ me: data.me, db: data.db ?? EMPTY, hydrated: true });
      } catch {
        // Sin conexión: se conserva lo que había y se marca como listo para no bloquear la UI.
        set({ hydrated: true });
      } finally {
        inflight = null;
      }
    })();
    return inflight;
  },

  async login(email, password) {
    try {
      const { data } = await post<{ ok: boolean; role?: Role; error?: string }>("/api/auth/login", { email, password });
      if (!data.ok) return { ok: false, error: data.error ?? "auth.invalid" };
      await get().bootstrap(true);
      return { ok: true, role: data.role };
    } catch {
      return { ok: false, error: "common.offline" };
    }
  },

  async logout() {
    await post("/api/auth/logout", {}).catch(() => null);
    set({ me: null, db: EMPTY });
  },

  async changePassword(current, next) {
    try {
      const { data } = await post<{ ok: boolean; error?: string }>("/api/auth/password", { current, next });
      if (!data.ok) return { ok: false, error: data.error ?? "common.error" };
      await get().bootstrap(true);
      return { ok: true };
    } catch {
      return { ok: false, error: "common.offline" };
    }
  },

  async act(action, extra) {
    try {
      const { status, data } = await post<{ ok: boolean; id?: string; error?: string; me?: User; db?: Database }>("/api/action", { action, ...extra });
      if (status === 401) {
        set({ me: null, db: EMPTY });
        return { ok: false, error: "auth.expired" };
      }
      if (!data.ok) return { ok: false, error: data.error ?? "common.error" };
      if (data.db) set({ db: data.db, me: data.me ?? get().me });
      return { ok: true, id: data.id };
    } catch {
      return { ok: false, error: "common.offline" };
    }
  },

  saveProduct: (product) => get().act({ type: "saveProduct", product }),
  recordMovement: (input) => get().act({ type: "recordMovement", input }),
  createSale: (input) => get().act({ type: "createSale", input }),
  setSaleStatus: (saleId, status, method) => get().act({ type: "setSaleStatus", saleId, status, method }),
  saveClient: (client) => get().act({ type: "saveClient", client }),
  saveUser: (user, password) => get().act({ type: "saveUser", user }, password ? { password } : undefined),
  updateProfile: (patch) => get().act({ type: "updateProfile", patch }),
  clearDemoData: () => get().act({ type: "clearDemoData" }),
}));

export function useCurrentUser(): User | null {
  return useStore((s) => s.me);
}
