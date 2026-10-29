/**
 * Base de datos del sistema en el servidor: un JSON en data/ (fuera del repositorio).
 * Se mantiene en memoria (un solo proceso con PM2) y cada cambio se escribe de forma atómica y en cola.
 * Las contraseñas viven aparte de los usuarios, cifradas con scrypt, y nunca se envían al navegador.
 */
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { createMockDatabase, mockPasswords } from "@/mocks";
import type { Database, User } from "./types";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const FILE = process.env.DB_FILE || join(/* turbopackIgnore: true */ process.cwd(), "data", "db.json");

/** Credenciales por usuario. `v` sube al cambiar la contraseña: invalida las sesiones abiertas. */
export interface Credential {
  hash: string;
  v: number;
}

interface Stored {
  version: 1;
  db: Database;
  auth: Record<string, Credential>;
}

let cache: Stored | null = null;
let loading: Promise<Stored> | null = null;
let queue: Promise<unknown> = Promise.resolve();

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(pw, salt, 32);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [algo, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const key = await scrypt(pw, Buffer.from(salt, "base64"), 32);
  const expected = Buffer.from(hash, "base64");
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** Primera puesta en marcha: datos de ejemplo para explorar el sistema. */
async function seed(): Promise<Stored> {
  const seedPassword = process.env.SEED_PASSWORD;
  // Contraseñas demo conocidas: solo en desarrollo o si se pide explícitamente (pruebas locales).
  const demoPasswords = process.env.NODE_ENV !== "production" || process.env.SEED_DEMO_PASSWORDS === "1";
  if (!seedPassword && !demoPasswords) throw new Error("SEED_PASSWORD no está configurada en el servidor.");
  const db = createMockDatabase();
  db.users = db.users.map((u) => ({ ...u, active: true, createdAt: "2025-01-01", mustChangePassword: !!seedPassword }));
  const auth: Stored["auth"] = {};
  for (const u of db.users) auth[u.id] = { hash: await hashPassword(seedPassword || mockPasswords[u.id]), v: 1 };
  return { version: 1, db, auth };
}

async function persist(state: Stored) {
  await mkdir(dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(state), "utf8");
  await rename(tmp, FILE);
}

async function load(): Promise<Stored> {
  if (cache) return cache;
  loading ??= (async () => {
    try {
      cache = JSON.parse(await readFile(FILE, "utf8")) as Stored;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
      cache = await seed();
      await persist(cache);
    }
    return cache;
  })();
  return loading;
}

export async function readState(): Promise<Readonly<Stored>> {
  return load();
}

/** Aplica un cambio en exclusión mutua y lo guarda en disco. */
export function mutate<T>(fn: (state: Stored) => Promise<{ state: Stored; result: T }> | { state: Stored; result: T }): Promise<T> {
  const run = queue.then(async () => {
    const current = await load();
    const { state, result } = await fn(current);
    if (state !== current) {
      await persist(state);
      cache = state;
    }
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

export function findUserByEmail(state: Stored, email: string): User | undefined {
  const e = email.trim().toLowerCase();
  return state.db.users.find((u) => u.email.toLowerCase() === e);
}
