/**
 * Almacén de solicitudes de distribuidores (solo servidor).
 * Un archivo JSON fuera del repositorio: sobrevive a `git pull` y a cada despliegue.
 * Las escrituras se encadenan en una cola para que dos solicitudes simultáneas no se pisen.
 */
import { randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Lead, LeadStatus, Locale } from "./types";

const FILE = process.env.LEADS_FILE || join(/* turbopackIgnore: true */ process.cwd(), "data", "leads.json");

async function readAll(): Promise<Lead[]> {
  try {
    return JSON.parse(await readFile(FILE, "utf8")) as Lead[];
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}

async function writeAll(leads: Lead[]) {
  await mkdir(dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(leads, null, 2), "utf8");
  await rename(tmp, FILE);
}

let queue: Promise<unknown> = Promise.resolve();
function mutate<T>(fn: (leads: Lead[]) => { leads: Lead[]; result: T }): Promise<T> {
  const run = queue.then(async () => {
    const { leads, result } = fn(await readAll());
    await writeAll(leads);
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

export function listLeads(): Promise<Lead[]> {
  return readAll().then((all) => all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export interface LeadInput {
  company: string;
  name: string;
  email: string;
  phone: string;
  volume: string;
  message: string;
  locale: Locale;
  source: Lead["source"];
}

export function createLead(input: LeadInput): Promise<Lead> {
  const now = new Date().toISOString();
  const lead: Lead = { ...input, id: `ld-${randomBytes(6).toString("hex")}`, status: "new", notes: "", sellerId: "", clientId: "", createdAt: now, updatedAt: now };
  return mutate((leads) => ({ leads: [...leads, lead], result: lead }));
}

export type LeadPatch = Partial<Pick<Lead, "status" | "notes" | "sellerId" | "clientId">>;

export function updateLead(id: string, patch: LeadPatch): Promise<Lead | null> {
  return mutate((leads) => {
    const i = leads.findIndex((l) => l.id === id);
    if (i < 0) return { leads, result: null };
    const next = { ...leads[i], ...patch, updatedAt: new Date().toISOString() };
    return { leads: leads.map((l, j) => (j === i ? next : l)), result: next };
  });
}

export function deleteLead(id: string): Promise<boolean> {
  return mutate((leads) => {
    const next = leads.filter((l) => l.id !== id);
    return { leads: next, result: next.length !== leads.length };
  });
}

/* ───────── Validación ───────── */

const STATUSES: LeadStatus[] = ["new", "contacted", "active", "rejected"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function parseLeadInput(body: Record<string, unknown>): { ok: true; value: Omit<LeadInput, "source"> } | { ok: false; error: string } {
  const value = {
    company: str(body.company, 120),
    name: str(body.name, 120),
    email: str(body.email, 160).toLowerCase(),
    phone: str(body.phone, 40),
    volume: str(body.volume, 60),
    message: str(body.message, 2000),
    locale: (body.locale === "en" ? "en" : "es") as Locale,
  };
  if (value.company.length < 2) return { ok: false, error: "company" };
  if (value.name.length < 2) return { ok: false, error: "name" };
  if (!EMAIL.test(value.email)) return { ok: false, error: "email" };
  return { ok: true, value };
}

export function parseLeadPatch(body: Record<string, unknown>): LeadPatch {
  const patch: LeadPatch = {};
  if (STATUSES.includes(body.status as LeadStatus)) patch.status = body.status as LeadStatus;
  if (typeof body.notes === "string") patch.notes = body.notes.slice(0, 4000);
  if (typeof body.sellerId === "string") patch.sellerId = body.sellerId.slice(0, 40);
  if (typeof body.clientId === "string") patch.clientId = body.clientId.slice(0, 40);
  return patch;
}

/* ───────── Acceso ───────── */

/** "missing" = el servidor no tiene clave configurada; "denied" = clave incorrecta. */
export function checkKey(req: Request): "ok" | "missing" | "denied" {
  const expected = process.env.LEADS_ADMIN_KEY;
  if (!expected) return "missing";
  const given = req.headers.get("x-leads-key") || "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b) ? "ok" : "denied";
}

/** Límite simple por IP para el formulario público (en memoria: se reinicia con el proceso). */
const hits = new Map<string, number[]>();
export function rateLimited(req: Request, max = 5, windowMs = 10 * 60_000, bucket = "leads"): boolean {
  const ip = `${bucket}:${req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local"}`;
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > max;
}
