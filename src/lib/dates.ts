const DAY = 86_400_000;

/** Fecha local en formato ISO corto (yyyy-mm-dd). */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function today(): string {
  return toISODate(new Date());
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function daysBetween(fromISO: string, toISO: string): number {
  return Math.round((parseISODate(toISO).getTime() - parseISODate(fromISO).getTime()) / DAY);
}

export function isSameMonth(iso: string, ref: string = today()): boolean {
  return iso.slice(0, 7) === ref.slice(0, 7);
}

export function startOfMonth(ref: string = today()): string {
  return `${ref.slice(0, 7)}-01`;
}
