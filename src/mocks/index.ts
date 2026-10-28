/**
 * Datos de demostración que simulan las reglas de negocio de Snap Slide.
 * Las fechas se generan relativas a "hoy" para que el demo siempre se vea vigente,
 * con un generador pseudoaleatorio con semilla: mismos datos en cada reinicio.
 */
import { addDays, today } from "@/lib/dates";
import type { Client, Expense, Movement, Payment, PaymentMethod, Product, Sale, SaleItem, User } from "@/lib/types";

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const mockUsers: User[] = [
  { id: "u-avril", name: "Avril", email: "avril@snapslide.com", password: "snap2026", role: "owner" },
  { id: "u-chris", name: "Chris", email: "chris@snapslide.com", password: "snap2026", role: "owner" },
  {
    id: "u-daniela",
    name: "Daniela Ruiz",
    email: "daniela@snapslide.com",
    password: "ventas2026",
    role: "seller",
    monthlyGoal: 45000,
    commissionRate: 0.08,
  },
  {
    id: "u-marco",
    name: "Marco Silva",
    email: "marco@snapslide.com",
    password: "ventas2026",
    role: "seller",
    monthlyGoal: 55000,
    commissionRate: 0.07,
  },
  {
    id: "u-jessica",
    name: "Jessica Moore",
    email: "jessica@snapslide.com",
    password: "ventas2026",
    role: "seller",
    monthlyGoal: 34000,
    commissionRate: 0.075,
  },
];

function buildProducts(): Product[] {
  const t = today();
  return [
    {
      id: "p-sheets-original",
      name: "Snap Sheets Original",
      sku: "SS-SH-060",
      type: "sheet",
      cost: 4.1,
      price: 12.9,
      minStock: 400,
      presentation: "Caja x 60 hojas",
      lots: [
        { id: "l1", code: "SH-2409-A", quantity: 520, expiresAt: addDays(t, 410), receivedAt: addDays(t, -40) },
        { id: "l2", code: "SH-2410-B", quantity: 380, expiresAt: addDays(t, 470), receivedAt: addDays(t, -12) },
      ],
    },
    {
      id: "p-sheets-ocean",
      name: "Snap Sheets Ocean Fresh",
      sku: "SS-SH-OCN",
      type: "sheet",
      cost: 4.4,
      price: 13.9,
      minStock: 300,
      presentation: "Caja x 60 hojas",
      lots: [{ id: "l3", code: "SH-2408-O", quantity: 140, expiresAt: addDays(t, 350), receivedAt: addDays(t, -70) }],
    },
    {
      id: "p-sheets-sensitive",
      name: "Snap Sheets Sensitive",
      sku: "SS-SH-SNS",
      type: "sheet",
      cost: 4.6,
      price: 14.5,
      minStock: 200,
      presentation: "Caja x 60 hojas",
      lots: [{ id: "l4", code: "SH-2410-S", quantity: 610, expiresAt: addDays(t, 500), receivedAt: addDays(t, -8) }],
    },
    {
      id: "p-sheets-pro",
      name: "Snap Sheets Pro B2B",
      sku: "SS-SH-240",
      type: "sheet",
      cost: 14.2,
      price: 39.0,
      minStock: 120,
      presentation: "Caja x 240 hojas",
      lots: [
        { id: "l5", code: "SH-2407-P", quantity: 35, expiresAt: addDays(t, 18), receivedAt: addDays(t, -110) },
        { id: "l6", code: "SH-2409-P", quantity: 60, expiresAt: addDays(t, 390), receivedAt: addDays(t, -30) },
      ],
    },
    {
      id: "p-liquid-1l",
      name: "Snap Liquid Original",
      sku: "SS-LQ-1L",
      type: "liquid",
      cost: 3.2,
      price: 9.9,
      minStock: 250,
      presentation: "Botella 1 L",
      lots: [{ id: "l7", code: "LQ-2409-1", quantity: 690, expiresAt: addDays(t, 600), receivedAt: addDays(t, -25) }],
    },
    {
      id: "p-liquid-gal",
      name: "Snap Liquid Concentrado",
      sku: "SS-LQ-GAL",
      type: "liquid",
      cost: 9.8,
      price: 27.5,
      minStock: 150,
      presentation: "Galón 3.78 L",
      lots: [{ id: "l8", code: "LQ-2406-G", quantity: 0, expiresAt: addDays(t, 220), receivedAt: addDays(t, -130) }],
    },
  ];
}

export const mockClients: Client[] = [
  { id: "c-bayfront", company: "Bayfront Laundry Co.", contact: "Laura Méndez", phone: "+1 305 555 0142", email: "laura@bayfrontlaundry.example", address: "1450 Biscayne Blvd", city: "Miami", zip: "33132", sellerId: "u-daniela", paymentTerms: 30, createdAt: "2025-03-10" },
  { id: "c-coralway", company: "Coral Way Cleaning Services", contact: "Roberto Paz", phone: "+1 305 555 0187", email: "rpaz@coralwayclean.example", address: "2280 SW 22nd St", city: "Miami", zip: "33145", sellerId: "u-daniela", paymentTerms: 15, createdAt: "2025-05-02" },
  { id: "c-doral", company: "Doral Facility Group", contact: "Kevin Hart-Lee", phone: "+1 305 555 0119", email: "kevin@doralfacility.example", address: "8300 NW 36th St", city: "Doral", zip: "33166", sellerId: "u-marco", paymentTerms: 45, createdAt: "2025-01-21" },
  { id: "c-hialeah", company: "Hialeah Fresh Market", contact: "Yanet Castillo", phone: "+1 305 555 0163", email: "yanet@hialeahfresh.example", address: "1200 W 49th St", city: "Hialeah", zip: "33012", sellerId: "u-marco", paymentTerms: 30, createdAt: "2025-06-14" },
  { id: "c-oceandrive", company: "Ocean Drive Suites", contact: "Sophie Laurent", phone: "+1 305 555 0175", email: "sophie@oceandrivesuites.example", address: "960 Ocean Dr", city: "Miami Beach", zip: "33139", sellerId: "u-jessica", paymentTerms: 30, createdAt: "2025-02-08" },
  { id: "c-wynwood", company: "Wynwood Wash Lab", contact: "Andrés Gil", phone: "+1 305 555 0111", email: "andres@wynwoodwash.example", address: "2520 NW 2nd Ave", city: "Miami", zip: "33127", sellerId: "u-jessica", paymentTerms: 15, createdAt: "2025-07-30" },
  { id: "c-havana", company: "Lavandería La Habana", contact: "Miguel Ortega", phone: "+1 305 555 0158", email: "miguel@lavhabana.example", address: "1530 SW 8th St", city: "Miami", zip: "33135", sellerId: "u-daniela", paymentTerms: 30, createdAt: "2025-04-17" },
  { id: "c-keymarina", company: "Key Marina Club", contact: "Grace Whitman", phone: "+1 305 555 0199", email: "grace@keymarina.example", address: "3400 Rickenbacker Cswy", city: "Key Biscayne", zip: "33149", sellerId: "u-marco", paymentTerms: 60, createdAt: "2025-08-05" },
];

/** Retraso típico (días) con el que paga cada cliente respecto a la fecha de la orden. */
const PAY_BEHAVIOR: Record<string, [number, number]> = {
  "c-bayfront": [20, 34],
  "c-coralway": [8, 16],
  "c-doral": [38, 62],
  "c-hialeah": [18, 40],
  "c-oceandrive": [25, 31],
  "c-wynwood": [5, 14],
  "c-havana": [28, 48],
  "c-keymarina": [45, 75],
};

function buildSales(products: Product[]) {
  const rand = mulberry32(20261027);
  const t = today();
  const sales: Sale[] = [];
  const payments: Payment[] = [];
  const methods: PaymentMethod[] = ["transfer", "transfer", "check", "card"];
  const total = 210;

  for (let i = 0; i < total; i++) {
    const daysAgo = Math.floor(rand() * 150);
    const date = addDays(t, -daysAgo);
    const client = mockClients[Math.floor(rand() * mockClients.length)];
    const lines = 1 + Math.floor(rand() * 3);
    const picked = [...products].sort(() => rand() - 0.5).slice(0, lines);
    const items: SaleItem[] = picked.map((p) => ({
      productId: p.id,
      quantity: (p.type === "sheet" ? 30 : 20) + Math.floor(rand() * 70),
      unitPrice: p.price,
    }));

    const [minDelay, maxDelay] = PAY_BEHAVIOR[client.id];
    const delay = minDelay + Math.floor(rand() * (maxDelay - minDelay));
    const payDate = addDays(date, delay);
    const isPaid = delay <= daysAgo;
    const id = `s-${String(i + 1).padStart(4, "0")}`;

    const sale: Sale = {
      id,
      number: "",
      clientId: client.id,
      sellerId: client.sellerId,
      date,
      dueDate: addDays(date, client.paymentTerms),
      items,
      status: isPaid ? (daysAgo > 6 ? "shipped" : "paid") : "pending",
      paidAt: isPaid ? payDate : undefined,
    };
    sales.push(sale);

    if (isPaid) {
      payments.push({
        id: `pay-${id}`,
        saleId: id,
        clientId: client.id,
        amount: items.reduce((s, it) => s + it.quantity * it.unitPrice, 0),
        date: payDate,
        method: methods[Math.floor(rand() * methods.length)],
      });
    }
  }

  sales.sort((a, b) => a.date.localeCompare(b.date));
  sales.forEach((s, idx) => (s.number = `SO-${String(1001 + idx)}`));
  return { sales, payments };
}

function buildExpenses(): Expense[] {
  const t = today();
  const expenses: Expense[] = [];
  const rand = mulberry32(777);
  for (let m = 0; m < 5; m++) {
    const base = addDays(t, -m * 30);
    expenses.push(
      { id: `e-rent-${m}`, date: addDays(base, -2), category: "rent", amount: 6800, description: "Renta de planta y almacén — Doral" },
      { id: `e-pay-${m}`, date: addDays(base, -1), category: "payroll", amount: 18500, description: "Nómina mensual" },
      { id: `e-mkt-${m}`, date: addDays(base, -9), category: "marketing", amount: 2400 + Math.round(rand() * 1800), description: "Campañas digitales" },
    );
    for (let w = 0; w < 4; w++) {
      expenses.push(
        { id: `e-prod-${m}-${w}`, date: addDays(base, -w * 7 - 3), category: "production", amount: 5200 + Math.round(rand() * 2600), description: "Materia prima y producción" },
        { id: `e-log-${m}-${w}`, date: addDays(base, -w * 7 - 5), category: "logistics", amount: 900 + Math.round(rand() * 700), description: "Distribución Miami-Dade" },
      );
    }
  }
  return expenses.filter((e) => e.date <= t);
}

function buildMovements(products: Product[]): Movement[] {
  return products
    .flatMap((p) =>
      p.lots.filter((lot) => lot.quantity > 0).map((lot) => ({
      id: `m-${lot.id}`,
      productId: p.id,
      lotCode: lot.code,
      type: "in" as const,
      reason: "production" as const,
      quantity: lot.quantity,
      date: lot.receivedAt,
      userId: "u-chris",
    })),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
}

export interface Database {
  users: User[];
  products: Product[];
  clients: Client[];
  sales: Sale[];
  payments: Payment[];
  movements: Movement[];
  expenses: Expense[];
}

export function createMockDatabase(): Database {
  const products = buildProducts();
  const { sales, payments } = buildSales(products);
  return {
    users: mockUsers,
    products,
    clients: mockClients,
    sales,
    payments,
    movements: buildMovements(products),
    expenses: buildExpenses(),
  };
}
