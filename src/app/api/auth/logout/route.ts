import { sessionCookie } from "@/lib/session.server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return Response.json({ ok: true }, { headers: { "Set-Cookie": sessionCookie(req, null) } });
}
