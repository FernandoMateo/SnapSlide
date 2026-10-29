"use client";

import { useMemo, useState } from "react";
import { ProductCodes } from "@/components/dashboard/ProductCodes";
import { Drawer, EmptyRow, Notice, PageHeader, SearchInput, Segmented, Table } from "@/components/dashboard/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { can, productStock, stockLevel } from "@/lib/business";
import { addDays, today } from "@/lib/dates";
import { useCurrentUser, useStore } from "@/lib/store";
import type { Lot, Product, ProductType } from "@/lib/types";

type Filter = "all" | ProductType;

const blankProduct = (): Product => ({
  id: "",
  name: "",
  sku: "",
  type: "sheet",
  cost: 0,
  price: 0,
  minStock: 100,
  presentation: "",
  lots: [],
});

export default function ProductsPage() {
  const { d, money, num, date } = useI18n();
  const user = useCurrentUser()!;
  const products = useStore((s) => s.db.products);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const canEdit = can(user, "products.edit");
  const showCost = can(user, "products.viewCost");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => (filter === "all" || p.type === filter) && (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)));
  }, [products, query, filter]);

  const head = [d.products.name, d.products.sku, d.products.type, ...(showCost ? [d.products.cost] : []), d.products.price, ...(showCost ? [d.products.margin] : []), d.products.stock, d.products.lots];

  return (
    <>
      <PageHeader
        title={d.products.title}
        subtitle={d.products.subtitle}
        actions={canEdit && <button onClick={() => setEditing(blankProduct())} className="btn btn-primary">+ {d.products.newProduct}</button>}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={query} onChange={setQuery} placeholder={d.products.searchPh} />
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: d.products.typeAll },
            { value: "sheet", label: d.products.sheet },
            { value: "liquid", label: d.products.liquid },
          ]}
        />
      </div>

      {!canEdit && <div className="mb-4"><Notice>{d.products.readOnly}</Notice></div>}

      <Table head={head}>
        {rows.length === 0 && <EmptyRow colSpan={head.length} label={d.common.none} />}
        {rows.map((p) => {
          const stock = productStock(p);
          const level = stockLevel(p);
          const nextExpiry = [...p.lots].filter((l) => l.quantity > 0).sort((a, b) => a.expiresAt.localeCompare(b.expiresAt))[0];
          return (
            <tr key={p.id} onClick={() => setEditing(p)} className="cursor-pointer transition-colors hover:bg-sky-soft/40">
              <td className="px-4 py-3.5">
                <span className="block font-bold text-ink">{p.name}</span>
                <span className="block text-xs text-ink-faint">{p.presentation}</span>
              </td>
              <td className="px-4 py-3.5 font-mono text-xs">{p.sku}</td>
              <td className="px-4 py-3.5">
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.type === "sheet" ? "bg-sky-soft text-sky-deep" : "bg-abyss/10 text-abyss"}`}>
                  {p.type === "sheet" ? d.products.sheet : d.products.liquid}
                </span>
              </td>
              {showCost && <td className="tabular px-4 py-3.5">{money(p.cost)}</td>}
              <td className="tabular px-4 py-3.5 font-semibold">{money(p.price)}</td>
              {showCost && <td className="tabular px-4 py-3.5 text-ok">{Math.round(((p.price - p.cost) / p.price) * 100)}%</td>}
              <td className="px-4 py-3.5">
                <span className={`tabular font-bold ${level === "ok" ? "text-ink" : level === "low" ? "text-[#b86b00]" : "text-danger"}`}>{num(stock)}</span>
                <span className="block text-xs text-ink-faint">{d.inventory.of} {num(p.minStock)}</span>
              </td>
              <td className="px-4 py-3.5 text-xs text-ink-soft">
                {p.lots.length} · {nextExpiry ? date(nextExpiry.expiresAt) : "—"}
              </td>
            </tr>
          );
        })}
      </Table>

      <Drawer open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? (canEdit ? d.products.editProduct : editing.name) : d.products.newProduct} wide>
        {editing && <ProductForm key={editing.id || "new"} initial={editing} canEdit={canEdit} showCost={showCost} onDone={() => setEditing(null)} />}
      </Drawer>
    </>
  );
}

function ProductForm({ initial, canEdit, showCost, onDone }: { initial: Product; canEdit: boolean; showCost: boolean; onDone: () => void }) {
  const { d, t } = useI18n();
  const saveProduct = useStore((s) => s.saveProduct);
  const [p, setP] = useState<Product>(initial);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((prev) => ({ ...prev, [k]: v }));
  const setLot = (i: number, patch: Partial<Lot>) => set("lots", p.lots.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await saveProduct({ ...p, id: p.id || `p-${p.sku.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` });
    if (res.ok) onDone();
    else setError(t(res.error));
  };

  return (
    <form onSubmit={submit} className="grid gap-6">
      <fieldset disabled={!canEdit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="pname">{d.products.name}</label>
          <input id="pname" required className="field" value={p.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="psku">{d.products.sku}</label>
          <input id="psku" required className="field font-mono uppercase" value={p.sku} onChange={(e) => set("sku", e.target.value.toUpperCase())} />
        </div>
        <div>
          <label className="label" htmlFor="ptype">{d.products.type}</label>
          <select id="ptype" className="field" value={p.type} onChange={(e) => set("type", e.target.value as ProductType)}>
            <option value="sheet">{d.products.sheet}</option>
            <option value="liquid">{d.products.liquid}</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="ppres">{d.products.presentation}</label>
          <input id="ppres" className="field" value={p.presentation} onChange={(e) => set("presentation", e.target.value)} />
        </div>
        {showCost && (
          <div>
            <label className="label" htmlFor="pcost">{d.products.cost}</label>
            <input id="pcost" type="number" min={0} step="0.01" inputMode="decimal" required className="field tabular" value={p.cost} onChange={(e) => set("cost", Number(e.target.value))} />
          </div>
        )}
        <div className={showCost ? "" : "sm:col-span-2"}>
          <label className="label" htmlFor="pprice">{d.products.price}</label>
          <input id="pprice" type="number" min={0} step="0.01" inputMode="decimal" required className="field tabular" value={p.price} onChange={(e) => set("price", Number(e.target.value))} />
        </div>
      </fieldset>

      <section className="rounded-2xl border border-sky/30 bg-sky-soft/50 p-5">
        <h3 className="font-display text-lg font-bold">{d.products.logistics}</h3>
        <p className="mt-1 text-sm text-ink-soft">{d.products.lotsHint}</p>
        <fieldset disabled={!canEdit} className="mt-4 grid gap-4">
          <div>
            <label className="label" htmlFor="pmin">{d.products.minStock}</label>
            <input id="pmin" type="number" min={0} required className="field tabular" value={p.minStock} onChange={(e) => set("minStock", Number(e.target.value))} />
          </div>
          <div className="grid gap-2">
            {p.lots.map((lot, i) => (
              <div key={lot.id} className="grid grid-cols-[1fr_1fr_0.8fr_auto] items-end gap-2">
                <div>
                  {i === 0 && <span className="label">{d.products.lot}</span>}
                  <input aria-label={d.products.lot} required className="field font-mono text-sm" value={lot.code} onChange={(e) => setLot(i, { code: e.target.value.toUpperCase() })} />
                </div>
                <div>
                  {i === 0 && <span className="label">{d.products.expiresAt}</span>}
                  <input aria-label={d.products.expiresAt} type="date" required className="field text-sm" value={lot.expiresAt} onChange={(e) => setLot(i, { expiresAt: e.target.value })} />
                </div>
                <div>
                  {i === 0 && <span className="label">{d.common.quantity}</span>}
                  <input aria-label={d.common.quantity} type="number" min={0} className="field tabular text-sm" value={lot.quantity} onChange={(e) => setLot(i, { quantity: Number(e.target.value) })} />
                </div>
                {canEdit && (
                  <button type="button" aria-label={d.products.removeLot} onClick={() => set("lots", p.lots.filter((_, idx) => idx !== i))} className="grid h-11 w-11 place-items-center rounded-xl text-ink-faint hover:bg-danger/10 hover:text-danger">
                    ×
                  </button>
                )}
              </div>
            ))}
            {canEdit && (
              <button
                type="button"
                onClick={() => set("lots", [...p.lots, { id: `l-${Date.now()}`, code: "", quantity: 0, expiresAt: addDays(today(), 365), receivedAt: today() }])}
                className="btn btn-ghost h-10 justify-self-start text-sm"
              >
                + {d.products.addLot}
              </button>
            )}
          </div>
        </fieldset>
      </section>

      <section>
        <h3 className="label">{d.products.codes}</h3>
        <ProductCodes sku={p.sku} name={p.name} />
      </section>

      {error && <Notice kind="error">{error}</Notice>}

      {canEdit && (
        <div className="sticky bottom-0 -mx-6 flex justify-end gap-2 border-t border-line bg-white px-6 py-4">
          <button type="button" onClick={onDone} className="btn btn-ghost">{d.common.cancel}</button>
          <button type="submit" className="btn btn-primary">{d.common.save}</button>
        </div>
      )}
    </form>
  );
}
