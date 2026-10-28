/// <reference path="../pb_data/types.d.ts" />

/**
 * Esquema de Snap Slide para PocketBase (v0.23+).
 * Replica el modelo de src/lib/types.ts. Los permisos por rol viven en las API rules
 * de cada colección: la "visión túnel" del vendedor no depende del frontend.
 *
 *  - users ........ auth: role (owner | seller), monthlyGoal, commissionRate
 *  - products ..... catálogo (sin costo: lo ven todos los usuarios autenticados)
 *  - product_costs  costo de producción, SOLO Owners
 *  - lots ......... stock por lote con fecha de caducidad
 *  - clients ...... cartera comercial (vendedor asignado)
 *  - sales ........ órdenes; se crean solo por POST /api/snapslide/sales (descuenta stock FEFO)
 *  - payments ..... cobros (se generan al marcar una orden como pagada)
 *  - movements .... entradas / salidas / ventas de inventario
 *  - expenses ..... egresos para el flujo de caja
 */
migrate(
  (app) => {
    const AUTHED = '@request.auth.id != ""';
    const OWNER = '@request.auth.role = "owner"';
    const timestamps = [
      { name: "created", type: "autodate", onCreate: true, onUpdate: false },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ];

    // ── users: se extiende la colección de auth por defecto ──
    const users = app.findCollectionByNameOrId("users");
    users.fields.add(new SelectField({ name: "role", values: ["owner", "seller"], maxSelect: 1, required: true }));
    users.fields.add(new NumberField({ name: "monthlyGoal", min: 0 }));
    users.fields.add(new NumberField({ name: "commissionRate", min: 0, max: 1 }));
    users.listRule = `id = @request.auth.id || ${OWNER}`;
    users.viewRule = `id = @request.auth.id || ${OWNER}`;
    users.createRule = OWNER; // sin registro público: los Owners dan de alta a los vendedores
    users.updateRule =
      `${OWNER} || (id = @request.auth.id && @request.body.role:isset = false ` +
      `&& @request.body.monthlyGoal:isset = false && @request.body.commissionRate:isset = false)`;
    users.deleteRule = OWNER;
    app.save(users);

    const products = new Collection({
      type: "base",
      name: "products",
      listRule: AUTHED,
      viewRule: AUTHED,
      createRule: OWNER,
      updateRule: OWNER,
      deleteRule: OWNER,
      fields: [
        { name: "name", type: "text", required: true, max: 120 },
        { name: "sku", type: "text", required: true, max: 40, pattern: "^[A-Z0-9-]+$" },
        { name: "type", type: "select", values: ["sheet", "liquid"], maxSelect: 1, required: true },
        { name: "price", type: "number", required: true, min: 0 },
        { name: "minStock", type: "number", min: 0, onlyInt: true },
        { name: "presentation", type: "text", max: 80 },
        ...timestamps,
      ],
      indexes: ["CREATE UNIQUE INDEX idx_products_sku ON products (sku)"],
    });
    app.save(products);

    const productCosts = new Collection({
      type: "base",
      name: "product_costs",
      listRule: OWNER,
      viewRule: OWNER,
      createRule: OWNER,
      updateRule: OWNER,
      deleteRule: OWNER,
      fields: [
        { name: "product", type: "relation", collectionId: products.id, maxSelect: 1, required: true, cascadeDelete: true },
        { name: "cost", type: "number", min: 0 },
        ...timestamps,
      ],
      indexes: ["CREATE UNIQUE INDEX idx_product_costs_product ON product_costs (product)"],
    });
    app.save(productCosts);

    const lots = new Collection({
      type: "base",
      name: "lots",
      listRule: AUTHED,
      viewRule: AUTHED,
      createRule: OWNER,
      updateRule: OWNER,
      deleteRule: OWNER,
      fields: [
        { name: "product", type: "relation", collectionId: products.id, maxSelect: 1, required: true, cascadeDelete: true },
        { name: "code", type: "text", required: true, max: 40 },
        { name: "quantity", type: "number", min: 0, onlyInt: true },
        { name: "expiresAt", type: "date", required: true },
        { name: "receivedAt", type: "date" },
        ...timestamps,
      ],
      indexes: ["CREATE UNIQUE INDEX idx_lots_product_code ON lots (product, code)"],
    });
    app.save(lots);

    const clients = new Collection({
      type: "base",
      name: "clients",
      listRule: AUTHED,
      viewRule: AUTHED,
      createRule: OWNER,
      updateRule: OWNER,
      deleteRule: OWNER,
      fields: [
        { name: "company", type: "text", required: true, max: 160 },
        { name: "contact", type: "text", max: 120 },
        { name: "phone", type: "text", max: 40 },
        { name: "email", type: "email" },
        { name: "address", type: "text", max: 200 },
        { name: "city", type: "text", max: 80 },
        { name: "zip", type: "text", max: 10 },
        { name: "seller", type: "relation", collectionId: users.id, maxSelect: 1, required: true },
        { name: "paymentTerms", type: "number", min: 0, onlyInt: true },
        ...timestamps,
      ],
    });
    app.save(clients);

    const sales = new Collection({
      type: "base",
      name: "sales",
      // Visión túnel: un vendedor solo lista, ve y edita sus propias órdenes.
      listRule: `${OWNER} || seller = @request.auth.id`,
      viewRule: `${OWNER} || seller = @request.auth.id`,
      // Nadie crea órdenes directo: se usa POST /api/snapslide/sales, que descuenta stock en la misma transacción.
      createRule: null,
      // El vendedor solo puede cambiar el estado y las notas de sus órdenes.
      updateRule:
        `${OWNER} || (seller = @request.auth.id && @request.body.items:isset = false && @request.body.seller:isset = false ` +
        `&& @request.body.client:isset = false && @request.body.number:isset = false && @request.body.paidAt:isset = false)`,
      deleteRule: OWNER,
      fields: [
        { name: "number", type: "text", required: true, max: 20 },
        { name: "client", type: "relation", collectionId: clients.id, maxSelect: 1, required: true },
        { name: "seller", type: "relation", collectionId: users.id, maxSelect: 1, required: true },
        { name: "date", type: "date", required: true },
        { name: "dueDate", type: "date", required: true },
        // [{ productId, quantity, unitPrice }] — precio congelado al momento de la venta
        { name: "items", type: "json", required: true, maxSize: 0 },
        { name: "status", type: "select", values: ["pending", "paid", "shipped"], maxSelect: 1, required: true },
        { name: "paidAt", type: "date" },
        { name: "notes", type: "text", max: 1000 },
        ...timestamps,
      ],
      indexes: ["CREATE UNIQUE INDEX idx_sales_number ON sales (number)", "CREATE INDEX idx_sales_seller_date ON sales (seller, date)"],
    });
    app.save(sales);

    const payments = new Collection({
      type: "base",
      name: "payments",
      listRule: `${OWNER} || sale.seller = @request.auth.id`,
      viewRule: `${OWNER} || sale.seller = @request.auth.id`,
      createRule: OWNER,
      updateRule: OWNER,
      deleteRule: OWNER,
      fields: [
        { name: "sale", type: "relation", collectionId: sales.id, maxSelect: 1, required: true, cascadeDelete: true },
        { name: "client", type: "relation", collectionId: clients.id, maxSelect: 1, required: true },
        { name: "amount", type: "number", required: true, min: 0 },
        { name: "date", type: "date", required: true },
        { name: "method", type: "select", values: ["transfer", "check", "card", "cash"], maxSelect: 1, required: true },
        ...timestamps,
      ],
    });
    app.save(payments);

    const movements = new Collection({
      type: "base",
      name: "movements",
      listRule: OWNER,
      viewRule: OWNER,
      createRule: null, // se registran con POST /api/snapslide/movements o al vender
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "product", type: "relation", collectionId: products.id, maxSelect: 1, required: true },
        { name: "lotCode", type: "text", required: true, max: 40 },
        { name: "type", type: "select", values: ["in", "out", "sale"], maxSelect: 1, required: true },
        {
          name: "reason",
          type: "select",
          values: ["production", "purchase", "waste", "damage", "expired", "adjustment", "sale"],
          maxSelect: 1,
          required: true,
        },
        { name: "quantity", type: "number", required: true, min: 1, onlyInt: true },
        { name: "date", type: "date", required: true },
        { name: "user", type: "relation", collectionId: users.id, maxSelect: 1, required: true },
        { name: "note", type: "text", max: 500 },
        ...timestamps,
      ],
    });
    app.save(movements);

    const expenses = new Collection({
      type: "base",
      name: "expenses",
      listRule: OWNER,
      viewRule: OWNER,
      createRule: OWNER,
      updateRule: OWNER,
      deleteRule: OWNER,
      fields: [
        { name: "date", type: "date", required: true },
        {
          name: "category",
          type: "select",
          values: ["production", "payroll", "logistics", "marketing", "rent", "other"],
          maxSelect: 1,
          required: true,
        },
        { name: "amount", type: "number", required: true, min: 0 },
        { name: "description", type: "text", max: 300 },
        ...timestamps,
      ],
    });
    app.save(expenses);
  },
  (app) => {
    for (const name of ["expenses", "movements", "payments", "sales", "clients", "lots", "product_costs", "products"]) {
      try {
        app.delete(app.findCollectionByNameOrId(name));
      } catch (_) {
        /* ya no existe */
      }
    }
    const users = app.findCollectionByNameOrId("users");
    for (const field of ["role", "monthlyGoal", "commissionRate"]) users.fields.removeByName(field);
    users.listRule = "id = @request.auth.id";
    users.viewRule = "id = @request.auth.id";
    users.createRule = "";
    users.updateRule = "id = @request.auth.id";
    users.deleteRule = "id = @request.auth.id";
    app.save(users);
  },
);
