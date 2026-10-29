import { checkKey, createLead, listLeads, parseLeadInput, rateLimited } from "@/lib/leads.server";
import { sessionUser } from "@/lib/session.server";

export const dynamic = "force-dynamic";

/** Un administrador con sesión iniciada entra directo; si no, se acepta la clave del servidor. */
async function leadsAccess(req: Request) {
  return (await sessionUser(req))?.role === "owner" ? "ok" : checkKey(req);
}

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Solicitudes registradas (solo el dashboard, con la clave del servidor). */
export async function GET(req: Request) {
  const access = await leadsAccess(req);
  if (access !== "ok") return json({ error: access }, access === "missing" ? 503 : 401);
  return json({ leads: await listLeads() });
}

/** Formulario público de distribución (landing) y alta manual desde el dashboard. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return json({ error: "body" }, 400);

  const fromDashboard = (await leadsAccess(req)) === "ok";
  // Campo trampa: los bots lo rellenan, las personas no lo ven. Se responde "ok" sin guardar.
  if (!fromDashboard && typeof body.website === "string" && body.website) return json({ ok: true });
  if (!fromDashboard && rateLimited(req)) return json({ error: "rate" }, 429);

  const parsed = parseLeadInput(body);
  if (!parsed.ok) return json({ error: parsed.error }, 422);

  const lead = await createLead({ ...parsed.value, source: fromDashboard ? "dashboard" : "web" });
  return json(fromDashboard ? { ok: true, lead } : { ok: true }, 201);
}
