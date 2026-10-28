/**
 * Reglas de negocio puras (sin React). Todo lo que la UI muestra sale de aquí,
 * así que al conectar PocketBase estas funciones se reutilizan sobre los datos que devuelve la API.
 * Lo que debe ser atómico (FEFO al vender, movimientos) vive además en pocketbase/pb_hooks.
 */
import { addDays, daysBetween, isSameMonth, today } from "./dates";
import type { Client, Expense, Lot, Payment, Product, Sale, User } from "./types";

/* ───────────── Permisos ───────────── */

export type Permission =
  | "finance.view"
  | "products.edit"
  | "products.viewCost"
  | "inventory.manage"
  | "sales.viewAll"
  | "sales.filterBySeller"
  | "clients.edit";

const OWNER_ONLY: Permission[] = [
  "finance.view",
  "products.edit",
  "products.viewCost",
  "inventory.manage",
  "sales.viewAll",
  "sales.filterBySeller",
  "clients.edit",
];

export function can(user: User | null | undefined, permission: Permission): boolean {
  if (!user) return false;
  if (user.role === "owner") return true;
  return !OWNER_ONLY.includes(permission);
}

/** "Visión túnel": un vendedor solo ve sus propias ventas. */
export function visibleSales(user: User, sales: Sale[]): Sale[] {
  return can(user, "sales.viewAll") ? sales : sales.filter((s) => s.sellerId === user.id);
}

export function canEditSale(user: User, sale: Sale): boolean {
  return user.role === "owner" || sale.sellerId === user.id;
}

/* ───────────── Ventas ───────────── */

export function saleTotal(sale: Pick<Sale, "items">): number {
  return sale.items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
}

export function salesInMonth(sales: Sale[], ref = today()): Sale[] {
  return sales.filter((s) => isSameMonth(s.date, ref));
}

export function sellerMonthStats(seller: User, sales: Sale[], ref = today()) {
  const own = salesInMonth(sales, ref).filter((s) => s.sellerId === seller.id);
  const total = own.reduce((sum, s) => sum + saleTotal(s), 0);
  const collected = own.filter((s) => s.status !== "pending").reduce((sum, s) => sum + saleTotal(s), 0);
  const rate = seller.commissionRate ?? 0;
  const goal = seller.monthlyGoal ?? 0;
  return {
    orders: own.length,
    total,
    /** Comisión devengada sobre todo lo vendido en el mes. */
    commission: total * rate,
    /** Parte de la comisión ya liquidable (órdenes cobradas). */
    commissionCollected: collected * rate,
    goal,
    progress: goal > 0 ? total / goal : 0,
  };
}

/* ───────────── Inventario ───────────── */

export function productStock(product: Product): number {
  return product.lots.reduce((sum, l) => sum + l.quantity, 0);
}

export type StockLevel = "out" | "critical" | "low" | "ok";

export function stockLevel(product: Product): StockLevel {
  const stock = productStock(product);
  if (stock <= 0) return "out";
  if (stock < product.minStock * 0.5) return "critical";
  if (stock < product.minStock) return "low";
  return "ok";
}

/** Lotes ordenados por caducidad: se despacha primero lo que vence antes (FEFO). */
export function lotsFEFO(product: Product): Lot[] {
  return [...product.lots].filter((l) => l.quantity > 0).sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));
}

/** Descuenta `quantity` de los lotes en orden FEFO. Devuelve los lotes nuevos y qué se tomó de cada uno. */
export function consumeFEFO(product: Product, quantity: number) {
  let remaining = quantity;
  const taken: { lotCode: string; quantity: number }[] = [];
  const order = lotsFEFO(product).map((l) => l.id);
  const lots = product.lots.map((l) => ({ ...l }));
  for (const id of order) {
    if (remaining <= 0) break;
    const lot = lots.find((l) => l.id === id)!;
    const take = Math.min(lot.quantity, remaining);
    lot.quantity -= take;
    remaining -= take;
    taken.push({ lotCode: lot.code, quantity: take });
  }
  return { lots, taken, shortfall: remaining };
}

export interface CriticalAlert {
  id: string;
  kind: "out" | "critical" | "low" | "expiring" | "overdue";
  productId?: string;
  clientId?: string;
  title: string;
  value: number;
}

export function criticalAlerts(products: Product[], sales: Sale[], clients: Client[]): CriticalAlert[] {
  const t = today();
  const alerts: CriticalAlert[] = [];
  for (const p of products) {
    const level = stockLevel(p);
    if (level !== "ok") alerts.push({ id: `stock-${p.id}`, kind: level, productId: p.id, title: p.name, value: productStock(p) });
    for (const lot of p.lots) {
      const days = daysBetween(t, lot.expiresAt);
      if (lot.quantity > 0 && days <= 45) {
        alerts.push({ id: `exp-${lot.id}`, kind: "expiring", productId: p.id, title: `${p.name} · ${lot.code}`, value: days });
      }
    }
  }
  const overdue = sales.filter((s) => s.status === "pending" && s.dueDate < t);
  const byClient = new Map<string, number>();
  overdue.forEach((s) => byClient.set(s.clientId, (byClient.get(s.clientId) ?? 0) + saleTotal(s)));
  byClient.forEach((amount, clientId) => {
    const c = clients.find((x) => x.id === clientId);
    alerts.push({ id: `od-${clientId}`, kind: "overdue", clientId, title: c?.company ?? clientId, value: amount });
  });
  const rank = { out: 0, critical: 1, expiring: 2, overdue: 3, low: 4 };
  return alerts.sort((a, b) => rank[a.kind] - rank[b.kind]);
}

/* ───────────── Finanzas ───────────── */

export interface DateRange {
  from?: string;
  to?: string;
}

const inRange = (iso: string, r: DateRange) => (!r.from || iso >= r.from) && (!r.to || iso <= r.to);

export function financials(payments: Payment[], expenses: Expense[], range: DateRange = {}) {
  const income = payments.filter((p) => inRange(p.date, range)).reduce((s, p) => s + p.amount, 0);
  const outflow = expenses.filter((e) => inRange(e.date, range)).reduce((s, e) => s + e.amount, 0);
  return { income, expenses: outflow, net: income - outflow, margin: income > 0 ? (income - outflow) / income : 0 };
}

/** Serie diaria de los últimos `days` días (ingresos cobrados vs. egresos). */
export function dailySeries(payments: Payment[], expenses: Expense[], days: number) {
  const t = today();
  return Array.from({ length: days }, (_, i) => {
    const d = addDays(t, i - days + 1);
    return {
      date: d,
      income: payments.filter((p) => p.date === d).reduce((s, p) => s + p.amount, 0),
      expenses: expenses.filter((e) => e.date === d).reduce((s, e) => s + e.amount, 0),
    };
  });
}

export interface ProjectionPoint {
  date: string;
  day: number;
  balance: number;
}

/**
 * Flujo de caja proyectado a 90 días.
 * Saldo inicial = cobrado − gastado (histórico). Entradas = facturas pendientes en su
 * fecha esperada (vencimiento + retraso medio del cliente) + ritmo diario de ventas nuevas.
 * Salidas = promedio diario de egresos de los últimos 60 días.
 */
export function cashFlowProjection(
  sales: Sale[],
  payments: Payment[],
  expenses: Expense[],
  clients: Client[],
  horizon = 90,
): ProjectionPoint[] {
  const t = today();
  const start = financials(payments, expenses).net;
  const last60 = { from: addDays(t, -60), to: t };
  const recent = financials(payments, expenses, last60);
  const dailyIncome = recent.income / 60;
  const dailyBurn = recent.expenses / 60;

  const expected = new Map<number, number>();
  for (const s of sales.filter((x) => x.status === "pending")) {
    const lateness = Math.max(0, clientPaymentStats(s.clientId, sales).avgDays - (clients.find((c) => c.id === s.clientId)?.paymentTerms ?? 30));
    const day = Math.max(1, daysBetween(t, addDays(s.dueDate, Math.round(lateness))));
    if (day <= horizon) expected.set(day, (expected.get(day) ?? 0) + saleTotal(s));
  }

  const points: ProjectionPoint[] = [{ date: t, day: 0, balance: start }];
  let balance = start;
  for (let day = 1; day <= horizon; day++) {
    // Las ventas nuevas se cobran ~30 días después: el ritmo actual entra a partir de ahí.
    balance += (expected.get(day) ?? 0) + (day > 30 ? dailyIncome : dailyIncome * 0.35) - dailyBurn;
    points.push({ date: addDays(t, day), day, balance });
  }
  return points;
}

/* ───────────── Clientes y cobranzas ───────────── */

export function clientPaymentStats(clientId: string, sales: Sale[]) {
  const paid = sales.filter((s) => s.clientId === clientId && s.paidAt);
  const avgDays = paid.length ? paid.reduce((sum, s) => sum + daysBetween(s.date, s.paidAt!), 0) / paid.length : 0;
  return { avgDays, paidCount: paid.length };
}

export function clientAccount(client: Client, sales: Sale[], payments: Payment[]) {
  const orders = sales.filter((s) => s.clientId === client.id).sort((a, b) => b.date.localeCompare(a.date));
  const pending = orders.filter((s) => s.status === "pending");
  const t = today();
  return {
    orders,
    /** CLV: total histórico comprado. */
    lifetimeValue: orders.reduce((sum, s) => sum + saleTotal(s), 0),
    avgDaysToPay: clientPaymentStats(client.id, sales).avgDays,
    payments: payments.filter((p) => p.clientId === client.id && orders.some((o) => o.id === p.saleId)).sort((a, b) => b.date.localeCompare(a.date)),
    pending,
    pendingTotal: pending.reduce((sum, s) => sum + saleTotal(s), 0),
    overdueTotal: pending.filter((s) => s.dueDate < t).reduce((sum, s) => sum + saleTotal(s), 0),
    lastOrder: orders[0]?.date,
  };
}
