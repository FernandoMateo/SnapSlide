/**
 * Motor del sistema: cada acción valida permisos y reglas, y devuelve la base nueva.
 * Funciones puras: el servidor (src/app/api/action) es el único que las ejecuta sobre los datos reales.
 */
import { can, canEditSale, consumeFEFO, productStock, saleTotal } from "./business";
import { addDays, today } from "./dates";
import type { Client, Database, Movement, MovementReason, PaymentMethod, Product, Role, Sale, SaleItem, SaleStatus, User } from "./types";

export type Result = { ok: true; id?: string } | { ok: false; error: string };

export interface UserInput {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  zone?: string;
  active?: boolean;
  clientId?: string;
  monthlyGoal?: number;
  commissionRate?: number;
}

export type Action =
  | { type: "saveProduct"; product: Product }
  | {
      type: "recordMovement";
      input: { productId: string; type: "in" | "out"; reason: MovementReason; quantity: number; lotCode: string; expiresAt?: string; note?: string };
    }
  | { type: "createSale"; input: { clientId: string; items: SaleItem[]; notes?: string } }
  | { type: "setSaleStatus"; saleId: string; status: SaleStatus; method?: PaymentMethod }
  | { type: "saveClient"; client: Client }
  | { type: "saveUser"; user: UserInput }
  | { type: "updateProfile"; patch: { name?: string; phone?: string } }
  | { type: "clearDemoData" };

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const fail = (error: string) => ({ db: null, result: { ok: false, error } as Result });

export function apply(db: Database, user: User, action: Action): { db: Database | null; result: Result } {
  switch (action.type) {
    case "saveProduct": {
      const product = action.product;
      if (!can(user, "products.edit")) return fail("perm.denied");
      if (db.products.some((p) => p.sku === product.sku && p.id !== product.id)) return fail("products.skuTaken");
      const exists = db.products.some((p) => p.id === product.id);
      const next = exists ? db.products.map((p) => (p.id === product.id ? { ...product, lots: p.lots } : p)) : [...db.products, { ...product, id: product.id || uid("p"), lots: [] }];
      return { db: { ...db, products: next }, result: { ok: true, id: product.id } };
    }

    case "recordMovement": {
      const { productId, type, reason, quantity, lotCode, expiresAt, note } = action.input;
      if (!can(user, "inventory.manage")) return fail("perm.denied");
      if (!Number.isFinite(quantity) || quantity <= 0) return fail("inventory.badQty");
      const code = lotCode.trim().toUpperCase();
      if (!code) return fail("inventory.badLot");
      const product = db.products.find((p) => p.id === productId);
      if (!product) return fail("inventory.noProduct");

      let lots = product.lots.map((l) => ({ ...l }));
      const lot = lots.find((l) => l.code === code);
      if (type === "in") {
        if (lot) lot.quantity += quantity;
        else lots.push({ id: uid("l"), code, quantity, expiresAt: expiresAt || addDays(today(), 365), receivedAt: today() });
      } else {
        if (!lot || lot.quantity < quantity) return fail("inventory.insufficient");
        lot.quantity -= quantity;
      }
      lots = lots.filter((l) => l.quantity > 0 || l.code === code);

      const movement: Movement = { id: uid("m"), productId, lotCode: code, type, reason, quantity, date: today(), userId: user.id, note };
      return {
        db: { ...db, products: db.products.map((p) => (p.id === productId ? { ...p, lots } : p)), movements: [movement, ...db.movements] },
        result: { ok: true, id: movement.id },
      };
    }

    case "createSale": {
      const { clientId, notes } = action.input;
      const isClient = user.role === "client";
      if (isClient ? user.clientId !== clientId : !can(user, "sales.viewAll") && user.role !== "seller") return fail("perm.denied");
      const client = db.clients.find((c) => c.id === clientId);
      if (!client) return fail("sales.noClient");

      // El precio lo fija el catálogo, nunca lo que mande el navegador. Se agrupan líneas repetidas.
      const merged = new Map<string, number>();
      for (const it of action.input.items) {
        const q = Math.floor(Number(it.quantity));
        if (q > 0) merged.set(it.productId, (merged.get(it.productId) ?? 0) + q);
      }
      if (!merged.size) return fail("sales.emptyCart");
      const items: SaleItem[] = [];
      for (const [productId, quantity] of merged) {
        const p = db.products.find((x) => x.id === productId);
        if (!p || productStock(p) < quantity) return fail("sales.noStock");
        items.push({ productId, quantity, unitPrice: p.price });
      }

      const saleId = uid("s");
      const movements: Movement[] = [];
      const products = db.products.map((p) => {
        const line = items.find((it) => it.productId === p.id);
        if (!line) return p;
        const { lots, taken } = consumeFEFO(p, line.quantity);
        taken.forEach((tk) => movements.push({ id: uid("m"), productId: p.id, lotCode: tk.lotCode, type: "sale", reason: "sale", quantity: tk.quantity, date: today(), userId: user.id, note: saleId }));
        return { ...p, lots };
      });

      const last = db.sales.reduce((n, s) => Math.max(n, Number(s.number.replace(/\D/g, "")) || 0), 1000);
      const sale: Sale = {
        id: saleId,
        number: `SO-${last + 1}`,
        clientId,
        // Un vendedor firma sus órdenes; Owner y cliente las registran a nombre del vendedor de la cuenta.
        sellerId: user.role === "seller" ? user.id : client.sellerId,
        date: today(),
        dueDate: addDays(today(), client.paymentTerms),
        items,
        status: "pending",
        notes: notes?.slice(0, 1000) || undefined,
        channel: isClient ? "portal" : undefined,
      };
      return { db: { ...db, products, sales: [...db.sales, sale], movements: [...movements, ...db.movements] }, result: { ok: true, id: sale.number } };
    }

    case "setSaleStatus": {
      const { saleId, status, method = "transfer" } = action;
      const sale = db.sales.find((s) => s.id === saleId);
      if (!sale || user.role === "client" || !canEditSale(user, sale)) return fail("perm.denied");
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
      return { db: { ...db, payments, sales: db.sales.map((s) => (s.id === saleId ? { ...s, status, paidAt } : s)) }, result: { ok: true } };
    }

    case "saveClient": {
      const client = action.client;
      if (!can(user, "clients.edit")) return fail("perm.denied");
      const exists = db.clients.some((c) => c.id === client.id);
      const id = exists ? client.id : uid("c");
      const next = exists ? db.clients.map((c) => (c.id === client.id ? client : c)) : [...db.clients, { ...client, id, createdAt: today() }];
      return { db: { ...db, clients: next }, result: { ok: true, id } };
    }

    case "saveUser": {
      if (!can(user, "users.manage")) return fail("perm.denied");
      const input = action.user;
      const email = input.email.trim().toLowerCase();
      const name = input.name.trim();
      if (name.length < 2) return fail("users.badName");
      if (!EMAIL.test(email)) return fail("users.badEmail");
      if (!["owner", "seller", "client"].includes(input.role)) return fail("users.badRole");
      if (db.users.some((u) => u.email.toLowerCase() === email && u.id !== input.id)) return fail("users.emailTaken");
      if (input.role === "client" && !db.clients.some((c) => c.id === input.clientId)) return fail("users.noClient");

      const existing = db.users.find((u) => u.id === input.id);
      // Nadie puede quitarse a sí mismo el rol de administrador ni desactivarse (evita quedar sin acceso).
      if (existing?.id === user.id && (input.role !== "owner" || input.active === false)) return fail("users.selfLock");

      const clean: User = {
        ...(existing ?? {}),
        id: existing?.id ?? uid("u"),
        name,
        email,
        role: input.role,
        phone: input.phone?.trim() || undefined,
        zone: input.role === "seller" ? input.zone?.trim() || undefined : undefined,
        active: input.active !== false,
        clientId: input.role === "client" ? input.clientId : undefined,
        monthlyGoal: input.role === "seller" ? Math.max(0, Number(input.monthlyGoal) || 0) : undefined,
        commissionRate: input.role === "seller" ? Math.min(0.5, Math.max(0, Number(input.commissionRate) || 0)) : undefined,
        createdAt: existing?.createdAt ?? today(),
        mustChangePassword: existing ? existing.mustChangePassword : true,
      };
      const users = existing ? db.users.map((u) => (u.id === clean.id ? clean : u)) : [...db.users, clean];
      return { db: { ...db, users }, result: { ok: true, id: clean.id } };
    }

    case "updateProfile": {
      const name = action.patch.name?.trim();
      if (name !== undefined && name.length < 2) return fail("users.badName");
      const users = db.users.map((u) =>
        u.id === user.id ? { ...u, name: name ?? u.name, phone: action.patch.phone !== undefined ? action.patch.phone.trim() || undefined : u.phone } : u,
      );
      return { db: { ...db, users }, result: { ok: true } };
    }

    case "clearDemoData": {
      if (!can(user, "users.manage")) return fail("perm.denied");
      // Empezar a operar en serio: fuera ventas, pagos, gastos, movimientos y clientes de ejemplo.
      // Se conservan usuarios del equipo y el catálogo (sin stock: se carga con ingresos reales).
      const users = db.users.filter((u) => u.role !== "client");
      return {
        db: { users, products: db.products.map((p) => ({ ...p, lots: [] })), clients: [], sales: [], payments: [], movements: [], expenses: [] },
        result: { ok: true },
      };
    }
  }
}

/** Lo que cada rol puede ver. El servidor solo envía esto al navegador. */
export function viewFor(db: Database, user: User): Database {
  const publicUser = (u: User): User => ({ id: u.id, name: u.name, email: u.email, role: u.role, phone: u.phone, zone: u.zone, active: u.active });
  if (user.role === "owner") return db;

  const products = db.products.map((p) => ({ ...p, cost: 0 }));
  if (user.role === "seller") {
    const sales = db.sales.filter((s) => s.sellerId === user.id);
    const ids = new Set(sales.map((s) => s.id));
    return {
      users: db.users.filter((u) => u.role !== "client").map((u) => (u.id === user.id ? u : publicUser(u))),
      products,
      clients: db.clients,
      sales,
      payments: db.payments.filter((p) => ids.has(p.saleId)),
      movements: [],
      expenses: [],
    };
  }

  // Cliente: solo su cuenta, sus pedidos y su vendedor.
  const client = db.clients.find((c) => c.id === user.clientId);
  return {
    users: db.users.filter((u) => u.id === user.id || u.id === client?.sellerId).map((u) => (u.id === user.id ? u : publicUser(u))),
    products,
    clients: client ? [client] : [],
    sales: db.sales.filter((s) => s.clientId === user.clientId),
    payments: db.payments.filter((p) => p.clientId === user.clientId),
    movements: [],
    expenses: [],
  };
}
