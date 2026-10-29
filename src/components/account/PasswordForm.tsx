"use client";

import { useState } from "react";
import { Notice } from "@/components/dashboard/ui";
import { useI18n } from "@/i18n/I18nProvider";
import { useStore } from "@/lib/store";

/** Cambio de la propia contraseña (perfil, portal y cambio obligatorio). */
export function PasswordForm({ onDone, dark }: { onDone?: () => void; dark?: boolean }) {
  const { d, t } = useI18n();
  const changePassword = useStore((s) => s.changePassword);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) return setMsg({ kind: "error", text: t("auth.weak") });
    if (next !== repeat) return setMsg({ kind: "error", text: d.account.mismatch });
    setBusy(true);
    const res = await changePassword(current, next);
    setBusy(false);
    if (!res.ok) return setMsg({ kind: "error", text: t(res.error) });
    setCurrent("");
    setNext("");
    setRepeat("");
    setMsg({ kind: "success", text: d.account.passwordChanged });
    onDone?.();
  };

  const label = `label ${dark ? "!text-white/60" : ""}`;
  return (
    <form onSubmit={submit} className="grid gap-4">
      <div>
        <label className={label} htmlFor="pw-current">{d.account.current}</label>
        <input id="pw-current" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} className="field" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="pw-next">{d.account.next}</label>
          <input id="pw-next" type="password" autoComplete="new-password" required minLength={8} value={next} onChange={(e) => setNext(e.target.value)} className="field" />
        </div>
        <div>
          <label className={label} htmlFor="pw-repeat">{d.account.repeat}</label>
          <input id="pw-repeat" type="password" autoComplete="new-password" required minLength={8} value={repeat} onChange={(e) => setRepeat(e.target.value)} className="field" />
        </div>
      </div>
      <p className={`-mt-1 text-xs ${dark ? "text-white/50" : "text-ink-faint"}`}>{d.account.rule}</p>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <button type="submit" disabled={busy} className="btn btn-primary h-12 text-sm">{d.account.save}</button>
    </form>
  );
}
