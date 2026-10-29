"use client";

import { useEffect, useState } from "react";
import { Drawer, Notice } from "@/components/dashboard/ui";
import { useI18n } from "@/i18n/I18nProvider";
import type { UserInput } from "@/lib/engine";
import { useStore } from "@/lib/store";
import type { Role, User } from "@/lib/types";

const ROLES: Role[] = ["seller", "client", "owner"];

/** Contraseña temporal legible (sin 0/O ni 1/l) para compartir por mensaje. */
function tempPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("").replace(/(.{4})(?=.)/g, "$1-");
}

/** Alta y edición de usuarios (solo administradores). */
export function UserDrawer({ open, onClose, user, defaultRole = "seller" }: { open: boolean; onClose: () => void; user: User | null; defaultRole?: Role }) {
  const { d, t } = useI18n();
  const clients = useStore((s) => s.db.clients);
  const saveUser = useStore((s) => s.saveUser);
  const [form, setForm] = useState<UserInput>(blank(defaultRole));
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(user ? { ...user, commissionRate: (user.commissionRate ?? 0) * 100 } : blank(defaultRole));
    setPassword(user ? "" : tempPassword());
    setError(null);
    setCreated(null);
    setCopied(false);
  }, [open, user, defaultRole]);

  const set = <K extends keyof UserInput>(k: K, v: UserInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await saveUser({ ...form, commissionRate: (Number(form.commissionRate) || 0) / 100 }, password || undefined);
    setBusy(false);
    if (!res.ok) return setError(t(res.error));
    if (!user || password) setCreated({ email: form.email.trim().toLowerCase(), password });
    else onClose();
  };

  const copy = async () => {
    if (!created) return;
    await navigator.clipboard?.writeText(`${created.email}\n${created.password}`).catch(() => null);
    setCopied(true);
  };

  return (
    <Drawer open={open} onClose={onClose} title={user ? d.team.edit : d.team.add}>
      {created ? (
        <div className="grid gap-5">
          <Notice kind="success">{d.team.created}</Notice>
          <div className="rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg, #035e94 0%, #0096d6 55%, #3fd0ff 100%)" }}>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">{d.account.email}</p>
            <p className="mt-1 break-all font-semibold">{created.email}</p>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-white/70">{d.team.tempPassword}</p>
            <p className="mt-1 font-mono text-xl font-bold tracking-wider">{created.password}</p>
          </div>
          <p className="text-sm text-ink-soft">{d.team.tempHint}</p>
          <div className="flex gap-2">
            <button onClick={copy} className="btn btn-ghost h-11 flex-1 text-sm">{copied ? `✓ ${d.common.copied}` : d.common.copy}</button>
            <button onClick={onClose} className="btn btn-primary h-11 flex-1 text-sm">{d.common.close}</button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-5">
          <fieldset>
            <legend className="label">{d.team.role}</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {ROLES.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => set("role", r)}
                  aria-pressed={form.role === r}
                  className={`rounded-2xl p-3 text-left transition-colors ${form.role === r ? "bg-ink text-white" : "bg-[#f2f7fb] text-ink ring-1 ring-line hover:ring-sky"}`}
                >
                  <span className="block text-sm font-bold">{d.team.roles[r]}</span>
                  <span className={`mt-0.5 block text-xs ${form.role === r ? "text-white/65" : "text-ink-faint"}`}>{d.team.roleHints[r]}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {form.role === "client" && (
            <div>
              <label className="label" htmlFor="u-client">{d.team.client}</label>
              {clients.length ? (
                <select id="u-client" required className="field" value={form.clientId ?? ""} onChange={(e) => set("clientId", e.target.value)}>
                  <option value="">{d.team.selectClient}</option>
                  {[...clients].sort((a, b) => a.company.localeCompare(b.company)).map((c) => (
                    <option key={c.id} value={c.id}>{c.company}</option>
                  ))}
                </select>
              ) : (
                <Notice kind="error">{d.team.noClients}</Notice>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="u-name" label={d.account.name} value={form.name} onChange={(v) => set("name", v)} required autoComplete="off" />
            <Field id="u-phone" label={d.account.phone} value={form.phone ?? ""} onChange={(v) => set("phone", v)} type="tel" />
          </div>
          <Field id="u-email" label={d.account.email} value={form.email} onChange={(v) => set("email", v)} type="email" required autoComplete="off" />

          {form.role === "seller" && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Field id="u-zone" label={d.team.zone} value={form.zone ?? ""} onChange={(v) => set("zone", v)} />
              <Field id="u-goal" label={d.team.goal} value={String(form.monthlyGoal ?? "")} onChange={(v) => set("monthlyGoal", Number(v))} type="number" />
              <Field id="u-comm" label={d.team.commission} value={String(form.commissionRate ?? "")} onChange={(v) => set("commissionRate", Number(v))} type="number" step="0.1" />
            </div>
          )}

          <div>
            <label className="label" htmlFor="u-pass">{user ? d.team.resetPassword : d.team.tempPassword}</label>
            <div className="flex gap-2">
              <input id="u-pass" className="field font-mono" value={password} onChange={(e) => setPassword(e.target.value)} required={!user} minLength={8} autoComplete="off" />
              <button type="button" onClick={() => setPassword(tempPassword())} className="btn btn-ghost h-11 shrink-0 px-4 text-sm">{d.team.generate}</button>
            </div>
            <p className="mt-1 text-xs text-ink-faint">{user ? d.team.resetHint : d.team.tempHint}</p>
          </div>

          {user && (
            <label className="flex items-center justify-between gap-3 rounded-2xl bg-[#f2f7fb] px-4 py-3 text-sm font-bold">
              {d.team.active}
              <input type="checkbox" checked={form.active !== false} onChange={(e) => set("active", e.target.checked)} className="h-5 w-5 accent-[#0096d6]" />
            </label>
          )}

          {error && <Notice kind="error">{error}</Notice>}
          <button type="submit" disabled={busy} className="btn btn-primary h-12 text-sm">{user ? d.common.save : d.team.create}</button>
        </form>
      )}
    </Drawer>
  );
}

function blank(role: Role): UserInput {
  return { id: "", name: "", email: "", role, phone: "", zone: "", active: true, clientId: "", monthlyGoal: 30000, commissionRate: 7 };
}

function Field({ id, label, value, onChange, ...rest }: { id: string; label: string; value: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <input id={id} className="field" value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
    </div>
  );
}
