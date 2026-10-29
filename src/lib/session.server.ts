/**
 * Sesión firmada en una cookie httpOnly: "<userId>.<versión>.<vence>.<firma>".
 * La versión coincide con la de la credencial: cambiar la contraseña cierra las demás sesiones.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { readState } from "./db.server";
import type { User } from "./types";

export const COOKIE = "ss_session";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 días

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET no está configurada en el servidor.");
  return "dev-only-session-secret";
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function createToken(userId: string, version: number): string {
  const payload = `${userId}.${version}.${Math.floor(Date.now() / 1000) + MAX_AGE}`;
  return `${payload}.${sign(payload)}`;
}

function parseCookie(req: Request): string | null {
  const raw = req.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === COOKIE) return decodeURIComponent(v.join("="));
  }
  return null;
}

/** Usuario de la sesión, o null si no hay sesión válida, venció, cambió la contraseña o está desactivado. */
export async function sessionUser(req: Request): Promise<User | null> {
  const token = parseCookie(req);
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [uid, v, exp, sig] = parts;
  const expected = Buffer.from(sign(`${uid}.${v}.${exp}`));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  const state = await readState();
  const user = state.db.users.find((u) => u.id === uid);
  if (!user || user.active === false || state.auth[uid]?.v !== Number(v)) return null;
  return user;
}

export function sessionCookie(req: Request, token: string | null): string {
  // "Secure" solo con HTTPS: mientras el sitio esté en http la cookie no viajaría.
  const https = req.headers.get("x-forwarded-proto") === "https" || new URL(req.url).protocol === "https:";
  const base = `${COOKIE}=${token ? encodeURIComponent(token) : ""}; Path=/; HttpOnly; SameSite=Lax${https ? "; Secure" : ""}`;
  return token ? `${base}; Max-Age=${MAX_AGE}` : `${base}; Max-Age=0`;
}
