import { viewFor } from "@/lib/engine";
import { readState } from "@/lib/db.server";
import { sessionUser } from "@/lib/session.server";

export const dynamic = "force-dynamic";

/** Datos que el usuario de la sesión puede ver. */
export async function GET(req: Request) {
  const user = await sessionUser(req);
  if (!user) return Response.json({ me: null }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const state = await readState();
  return Response.json({ me: user, db: viewFor(state.db, user) }, { headers: { "Cache-Control": "no-store" } });
}
