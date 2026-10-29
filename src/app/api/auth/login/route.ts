import { findUserByEmail, readState, verifyPassword } from "@/lib/db.server";
import { rateLimited } from "@/lib/leads.server";
import { createToken, sessionCookie } from "@/lib/session.server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (rateLimited(req, 10, 10 * 60_000, "login")) return Response.json({ ok: false, error: "auth.rate" }, { status: 429 });
  const body = (await req.json().catch(() => null)) as { email?: unknown; password?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";

  const state = await readState();
  const user = findUserByEmail(state, email);
  const cred = user && state.auth[user.id];
  // Mismo mensaje para usuario inexistente, desactivado o contraseña incorrecta.
  if (!user || !cred || user.active === false || !(await verifyPassword(password, cred.hash))) {
    return Response.json({ ok: false, error: "auth.invalid" }, { status: 401 });
  }
  return Response.json(
    { ok: true, role: user.role },
    { headers: { "Set-Cookie": sessionCookie(req, createToken(user.id, cred.v)), "Cache-Control": "no-store" } },
  );
}
