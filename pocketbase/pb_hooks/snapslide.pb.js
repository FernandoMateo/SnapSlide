/// <reference path="../pb_data/types.d.ts" />

/**
 * Lógica de servidor de Snap Slide (equivale a src/lib/store.ts del modo demo).
 * Nota JSVM: cada handler corre aislado, no puede usar variables ni funciones definidas
 * fuera de él. Por eso los pequeños helpers se repiten dentro de cada uno.
 */

/**
 * POST /api/snapslide/sales
 * body: { client: string, items: [{ productId, quantity }], notes?: string }
 * Valida stock, descuenta los lotes en orden FEFO (vence antes, sale antes),
 * registra los movimientos y crea la orden. Todo o nada.
 */
routerAdd(
  "POST",
  "/api/snapslide/sales",
  (e) => {
    const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10) + " 00:00:00.000Z";
    // `code` es la clave de traducción del frontend (src/i18n), estable aunque cambie el texto.
    const bad = (code) => e.json(400, { status: 400, code: code, message: code });
    const auth = e.auth;
    const body = e.requestInfo().body || {};
    const items = Array.isArray(body.items) ? body.items : [];
    if (!body.client) return bad("sales.noClient");
    if (items.length === 0) return bad("sales.emptyCart");

    let failure = "";
    let result = null;
    try {
      e.app.runInTransaction((txApp) => {
        const client = txApp.findRecordById("clients", body.client);
        const lines = [];
        const taken = [];

        for (const it of items) {
          const qty = Math.floor(Number(it.quantity));
          if (!(qty > 0)) {
            failure = "inventory.badQty";
            throw new Error(failure);
          }
          const product = txApp.findRecordById("products", it.productId);
          const lots = txApp.findRecordsByFilter("lots", "product = {:p} && quantity > 0", "expiresAt", 500, 0, { p: product.id });
          let remaining = qty;
          for (const lot of lots) {
            if (remaining <= 0) break;
            const take = Math.min(lot.getInt("quantity"), remaining);
            lot.set("quantity", lot.getInt("quantity") - take);
            txApp.save(lot);
            remaining -= take;
            taken.push({ product: product.id, lotCode: lot.getString("code"), quantity: take });
          }
          if (remaining > 0) {
            failure = "sales.noStock";
            throw new Error(failure);
          }
          lines.push({ productId: product.id, quantity: qty, unitPrice: product.getFloat("price") });
        }

        const now = Date.now();
        const sale = new Record(txApp.findCollectionByNameOrId("sales"));
        sale.set("number", "SO-" + (1001 + txApp.countRecords("sales")));
        sale.set("client", client.id);
        // Un vendedor firma sus órdenes; un Owner las registra a nombre del vendedor de la cuenta.
        sale.set("seller", auth.getString("role") === "seller" ? auth.id : client.getString("seller"));
        sale.set("date", isoDay(now));
        sale.set("dueDate", isoDay(now + client.getInt("paymentTerms") * 86400000));
        sale.set("items", lines);
        sale.set("status", "pending");
        sale.set("notes", String(body.notes || ""));
        txApp.save(sale);

        const movementCol = txApp.findCollectionByNameOrId("movements");
        for (const t of taken) {
          const m = new Record(movementCol);
          m.set("product", t.product);
          m.set("lotCode", t.lotCode);
          m.set("type", "sale");
          m.set("reason", "sale");
          m.set("quantity", t.quantity);
          m.set("date", isoDay(now));
          m.set("user", auth.id);
          m.set("note", sale.id);
          txApp.save(m);
        }

        result = { id: sale.id, number: sale.getString("number") };
      });
    } catch (err) {
      if (failure) return bad(failure);
      throw err;
    }

    return e.json(200, result);
  },
  $apis.requireAuth("users"),
);

/**
 * POST /api/snapslide/movements  (solo Owners)
 * body: { productId, type: "in" | "out", reason, quantity, lotCode, expiresAt?, note? }
 * Entradas suman a un lote (o lo crean); salidas (mermas, ajustes) restan. Las ventas no pasan por aquí.
 */
routerAdd(
  "POST",
  "/api/snapslide/movements",
  (e) => {
    const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10) + " 00:00:00.000Z";
    const bad = (code) => e.json(400, { status: 400, code: code, message: code });
    const auth = e.auth;
    if (auth.getString("role") !== "owner") return e.json(403, { status: 403, code: "perm.denied", message: "perm.denied" });

    const body = e.requestInfo().body || {};
    const qty = Math.floor(Number(body.quantity));
    const lotCode = String(body.lotCode || "").trim().toUpperCase();
    if (!(qty > 0)) return bad("inventory.badQty");
    if (!lotCode) return bad("inventory.noLot");
    if (body.type !== "in" && body.type !== "out") return bad("inventory.badType");

    let failure = "";
    let result = null;
    try {
      e.app.runInTransaction((txApp) => {
        const product = txApp.findRecordById("products", body.productId);
        let lot = null;
        try {
          lot = txApp.findFirstRecordByFilter("lots", "product = {:p} && code = {:c}", { p: product.id, c: lotCode });
        } catch (_) {
          lot = null;
        }

        if (body.type === "in") {
          if (!lot) {
            lot = new Record(txApp.findCollectionByNameOrId("lots"));
            lot.set("product", product.id);
            lot.set("code", lotCode);
            lot.set("quantity", 0);
            lot.set("expiresAt", body.expiresAt ? String(body.expiresAt).slice(0, 10) + " 00:00:00.000Z" : isoDay(Date.now() + 365 * 86400000));
            lot.set("receivedAt", isoDay(Date.now()));
          }
          lot.set("quantity", lot.getInt("quantity") + qty);
        } else {
          if (!lot || lot.getInt("quantity") < qty) {
            failure = "inventory.insufficient";
            throw new Error(failure);
          }
          lot.set("quantity", lot.getInt("quantity") - qty);
        }
        txApp.save(lot);

        const m = new Record(txApp.findCollectionByNameOrId("movements"));
        m.set("product", product.id);
        m.set("lotCode", lotCode);
        m.set("type", body.type);
        m.set("reason", String(body.reason || (body.type === "in" ? "production" : "adjustment")));
        m.set("quantity", qty);
        m.set("date", isoDay(Date.now()));
        m.set("user", auth.id);
        m.set("note", String(body.note || ""));
        txApp.save(m);
        result = { id: m.id, lot: lot.id, quantity: lot.getInt("quantity") };
      });
    } catch (err) {
      if (failure) return bad(failure);
      throw err;
    }

    return e.json(200, result);
  },
  $apis.requireAuth("users"),
);

/**
 * Al pasar una orden de "pending" a "paid"/"shipped" se registra el cobro (y paidAt).
 * Al volver a "pending" se anulan los cobros de esa orden.
 */
onRecordUpdate((e) => {
  const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10) + " 00:00:00.000Z";
  const rec = e.record;
  const before = rec.original().getString("status");
  const after = rec.getString("status");
  const becamePaid = before === "pending" && after !== "pending" && !rec.getString("paidAt");
  const backToPending = before !== "pending" && after === "pending";

  if (becamePaid) rec.set("paidAt", isoDay(Date.now()));
  if (backToPending) rec.set("paidAt", "");

  e.next();

  if (becamePaid) {
    const items = JSON.parse(rec.getString("items") || "[]");
    const amount = items.reduce((sum, it) => sum + Number(it.quantity) * Number(it.unitPrice), 0);
    const p = new Record(e.app.findCollectionByNameOrId("payments"));
    p.set("sale", rec.id);
    p.set("client", rec.getString("client"));
    p.set("amount", amount);
    p.set("date", isoDay(Date.now()));
    p.set("method", "transfer");
    e.app.save(p);
  }
  if (backToPending) {
    const paid = e.app.findRecordsByFilter("payments", "sale = {:s}", "", 0, 0, { s: rec.id });
    for (const p of paid) e.app.delete(p);
  }
}, "sales");
