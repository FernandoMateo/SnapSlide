import { checkKey, deleteLead, parseLeadPatch, updateLead } from "@/lib/leads.server";
import { sessionUser } from "@/lib/session.server";

export const dynamic = "force-dynamic";

/** Un administrador con sesión iniciada entra directo; si no, se acepta la clave del servidor. */
async function leadsAccess(req: Request) {
  return (await sessionUser(req))?.role === "owner" ? "ok" : checkKey(req);
}

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await leadsAccess(req);
  if (access !== "ok") return json({ error: access }, access === "missing" ? 503 : 401);
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return json({ error: "body" }, 400);
  const lead = await updateLead((await params).id, parseLeadPatch(body));
  return lead ? json({ lead }) : json({ error: "not-found" }, 404);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const access = await leadsAccess(req);
  if (access !== "ok") return json({ error: access }, access === "missing" ? 503 : 401);
  return (await deleteLead((await params).id)) ? json({ ok: true }) : json({ error: "not-found" }, 404);
}
