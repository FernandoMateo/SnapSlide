export type Role = "owner" | "seller";
export type Locale = "es" | "en";

export interface User {
  id: string;
  name: string;
  email: string;
  /** Solo para el modo demo. En producción la autenticación vive en el backend. */
  password: string;
  role: Role;
  /** Meta de ventas mensual en USD (solo vendedores). */
  monthlyGoal?: number;
  /** Comisión sobre ventas, 0.08 = 8% (solo vendedores). */
  commissionRate?: number;
}

/** Embudo de distribuidores: los mismos 3 pasos de la landing, más "descartada". */
export type LeadStatus = "new" | "contacted" | "active" | "rejected";

/** Solicitud para ser distribuidor. Vive en el servidor (data/leads.json), no en el mock del navegador. */
export interface Lead {
  id: string;
  company: string;
  name: string;
  email: string;
  phone: string;
  volume: string;
  message: string;
  source: "web" | "dashboard";
  locale: Locale;
  status: LeadStatus;
  notes: string;
  /** Vendedor asignado (id del usuario). */
  sellerId: string;
  /** Cliente creado en el sistema al activarlo. */
  clientId: string;
  createdAt: string;
  updatedAt: string;
}

export type ProductType = "sheet" | "liquid";

export interface Lot {
  id: string;
  code: string;
  quantity: number;
  /** ISO date (yyyy-mm-dd) */
  expiresAt: string;
  receivedAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  type: ProductType;
  /** Costo de producción por unidad. Solo visible para Owners. */
  cost: number;
  price: number;
  /** Punto de reorden: por debajo de este stock se dispara la alerta. */
  minStock: number;
  /** Ej. "Caja x 60 hojas", "Botella 1 L" */
  presentation: string;
  lots: Lot[];
}

export interface Client {
  id: string;
  company: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  zip: string;
  /** Vendedor que gestiona la cuenta. */
  sellerId: string;
  /** Días de crédito otorgados. */
  paymentTerms: number;
  createdAt: string;
}

export type SaleStatus = "pending" | "paid" | "shipped";

export interface SaleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface Sale {
  id: string;
  number: string;
  clientId: string;
  sellerId: string;
  date: string;
  dueDate: string;
  items: SaleItem[];
  status: SaleStatus;
  paidAt?: string;
  notes?: string;
}

export type PaymentMethod = "transfer" | "check" | "card" | "cash";

export interface Payment {
  id: string;
  saleId: string;
  clientId: string;
  amount: number;
  date: string;
  method: PaymentMethod;
}

export type MovementType = "in" | "out" | "sale";
export type MovementReason = "production" | "purchase" | "waste" | "damage" | "expired" | "adjustment" | "sale";

export interface Movement {
  id: string;
  productId: string;
  lotCode: string;
  type: MovementType;
  reason: MovementReason;
  quantity: number;
  date: string;
  userId: string;
  note?: string;
}

export type ExpenseCategory = "production" | "payroll" | "logistics" | "marketing" | "rent" | "other";

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
}
