import { apply, viewFor, type Action, type Result } from "@/lib/engine";
import { hashPassword, mutate } from "@/lib/db.server";
import { sessionUser } from "@/lib/session.server";
import type { Database, User } from "@/lib/types";

export const dynamic = "force-dynamic";

type Body = { action?: Action; password?: unknown };
type Out = { result: Result; view: { me: User; db: Database } | null };

/**
 * Ejecuta una acción del sistema como el usuario de la sesión y devuelve los datos actualizados.
 * Las altas de usuarios y los reseteos de contraseña también pasan por aquí: el motor valida
 * los datos y este handler guarda la credencial cifrada.
 */
export async function POST(req: Request) {
  const user = await sessionUser(req);
  if (!user) return Response.json({ ok: false, error: "auth.expired" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as Body | null;
  const action = body?.action;
  if (!action || typeof action !== "object" || typeof action.type !== "string") return Response.json({ ok: false, error: "action.invalid" }, { status: 400 });
  const password = typeof body?.password === "string" ? body.password : "";

  const out = await mutate<Out>(async (state) => {
    // El usuario puede haber cambiado desde que se validó la cookie: se usa la versión actual.
    const me = state.db.users.find((u) => u.id === user.id)!;
    const { db, result } = apply(state.db, me, action);
    if (!db || !result.ok) return { state, result: { result, view: null } };

    let auth = state.auth;
    let users = db.users;
    if (action.type === "saveUser") {
      const id = result.id!;
      const isNew = !state.auth[id];
      if (isNew && password.length < 8) return { state, result: { result: { ok: false as const, error: "auth.weak" }, view: null } };
      if (password) {
        if (password.length < 8) return { state, result: { result: { ok: false as const, error: "auth.weak" }, view: null } };
        // Contraseña temporal: el usuario deberá cambiarla al entrar; se cierran sus sesiones abiertas.
        auth = { ...auth, [id]: { hash: await hashPassword(password), v: (state.auth[id]?.v ?? 0) + 1 } };
        users = users.map((u) => (u.id === id ? { ...u, mustChangePassword: true } : u));
      }
    }
    if (action.type === "clearDemoData") {
      const keep = new Set(users.map((u) => u.id));
      auth = Object.fromEntries(Object.entries(auth).filter(([id]) => keep.has(id)));
    }

    const next = { ...state, db: { ...db, users }, auth };
    const fresh = next.db.users.find((u) => u.id === user.id)!;
    return { state: next, result: { result, view: { me: fresh, db: viewFor(next.db, fresh) } } };
  });

  if (!out.result.ok) return Response.json(out.result, { status: 422 });
  return Response.json({ ...out.result, ...out.view }, { headers: { "Cache-Control": "no-store" } });
}
