/**
 * Carga en PocketBase los mismos datos demo que usa el frontend (src/mocks).
 *
 *   PB_URL=http://127.0.0.1:8090 PB_SUPERUSER_EMAIL=... PB_SUPERUSER_PASSWORD=... npm run seed:pb
 *
 * Solo para desarrollo: crea usuarios con las contraseñas demo. No lo ejecutes contra producción.
 */
import PocketBase from "pocketbase";
import { createMockDatabase, mockPasswords } from "../src/mocks/index.ts";

const url = process.env.PB_URL ?? "http://127.0.0.1:8090";
const email = process.env.PB_SUPERUSER_EMAIL;
const password = process.env.PB_SUPERUSER_PASSWORD;
if (!email || !password) {
  console.error("Faltan PB_SUPERUSER_EMAIL y PB_SUPERUSER_PASSWORD.");
  process.exit(1);
}

const pb = new PocketBase(url);
pb.autoCancellation(false);
await pb.collection("_superusers").authWithPassword(email, password);

const existing = await pb.collection("products").getList(1, 1);
if (existing.totalItems > 0) {
  console.error("La base ya tiene productos; el seed solo corre sobre una base vacía.");
  process.exit(1);
}

const db = createMockDatabase();
const day = (iso: string) => `${iso} 00:00:00.000Z`;
const ids = new Map<string, string>(); // id del mock → id de PocketBase

for (const u of db.users) {
  const rec = await pb.collection("users").create({
    email: u.email,
    password: mockPasswords[u.id],
    passwordConfirm: mockPasswords[u.id],
    name: u.name,
    role: u.role,
    monthlyGoal: u.monthlyGoal ?? 0,
    commissionRate: u.commissionRate ?? 0,
    verified: true,
  });
  ids.set(u.id, rec.id);
}

for (const p of db.products) {
  const rec = await pb.collection("products").create({
    name: p.name,
    sku: p.sku,
    type: p.type,
    price: p.price,
    minStock: p.minStock,
    presentation: p.presentation,
  });
  ids.set(p.id, rec.id);
  await pb.collection("product_costs").create({ product: rec.id, cost: p.cost });
  for (const lot of p.lots) {
    await pb.collection("lots").create({ product: rec.id, code: lot.code, quantity: lot.quantity, expiresAt: day(lot.expiresAt), receivedAt: day(lot.receivedAt) });
  }
}

for (const c of db.clients) {
  const rec = await pb.collection("clients").create({ ...c, id: undefined, createdAt: undefined, seller: ids.get(c.sellerId) });
  ids.set(c.id, rec.id);
}

for (const s of db.sales) {
  const rec = await pb.collection("sales").create({
    number: s.number,
    client: ids.get(s.clientId),
    seller: ids.get(s.sellerId),
    date: day(s.date),
    dueDate: day(s.dueDate),
    items: s.items.map((it) => ({ ...it, productId: ids.get(it.productId) })),
    status: s.status,
    paidAt: s.paidAt ? day(s.paidAt) : "",
    notes: s.notes ?? "",
  });
  ids.set(s.id, rec.id);
}

for (const p of db.payments) {
  await pb.collection("payments").create({ sale: ids.get(p.saleId), client: ids.get(p.clientId), amount: p.amount, date: day(p.date), method: p.method });
}

for (const m of db.movements) {
  await pb.collection("movements").create({
    product: ids.get(m.productId),
    lotCode: m.lotCode,
    type: m.type,
    reason: m.reason,
    quantity: m.quantity,
    date: day(m.date),
    user: ids.get(m.userId),
    note: m.note ?? "",
  });
}

for (const e of db.expenses) {
  await pb.collection("expenses").create({ date: day(e.date), category: e.category, amount: e.amount, description: e.description });
}

console.log(
  `Seed listo: ${db.users.length} usuarios, ${db.products.length} productos, ${db.clients.length} clientes, ` +
    `${db.sales.length} ventas, ${db.payments.length} pagos, ${db.expenses.length} gastos.`,
);
