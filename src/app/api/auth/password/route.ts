import { hashPassword, mutate, verifyPassword } from "@/lib/db.server";
import { rateLimited } from "@/lib/leads.server";
import { createToken, sessionCookie, sessionUser } from "@/lib/session.server";

export const dynamic = "force-dynamic";

/** Cambio de la propia contraseña. Cierra las demás sesiones y renueva la actual. */
export async function POST(req: Request) {
  const user = await sessionUser(req);
  if (!user) return Response.json({ ok: false, error: "auth.expired" }, { status: 401 });
  if (rateLimited(req, 10, 10 * 60_000, "password")) return Response.json({ ok: false, error: "auth.rate" }, { status: 429 });

  const body = (await req.json().catch(() => null)) as { current?: unknown; next?: unknown } | null;
  const current = typeof body?.current === "string" ? body.current : "";
  const next = typeof body?.next === "string" ? body.next : "";
  if (next.length < 8) return Response.json({ ok: false, error: "auth.weak" }, { status: 422 });

  const result = await mutate(async (state) => {
    const cred = state.auth[user.id];
    if (!cred || !(await verifyPassword(current, cred.hash))) return { state, result: null };
    const v = cred.v + 1;
    return {
      state: {
        ...state,
        auth: { ...state.auth, [user.id]: { hash: await hashPassword(next), v } },
        db: { ...state.db, users: state.db.users.map((u) => (u.id === user.id ? { ...u, mustChangePassword: false } : u)) },
      },
      result: v,
    };
  });
  if (result === null) return Response.json({ ok: false, error: "auth.wrongCurrent" }, { status: 403 });
  return Response.json({ ok: true }, { headers: { "Set-Cookie": sessionCookie(req, createToken(user.id, result)) } });
}
