export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const nowIso = () => new Date().toISOString();

/** Local calendar date YYYY-MM-DD */
export function localDate(d: Date | string = new Date()): string {
  const x = typeof d === "string" ? new Date(d) : d;
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date | string, days: number): Date {
  const x = new Date(typeof d === "string" ? d : d.getTime());
  x.setDate(x.getDate() + days);
  return x;
}

export function daysBetween(a: Date | string, b: Date | string): number {
  const da = new Date(localDate(a) + "T00:00:00");
  const db = new Date(localDate(b) + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

/** Monday of the week containing d, as YYYY-MM-DD */
export function weekStart(d: Date | string = new Date()): string {
  const x = new Date(typeof d === "string" ? d : d.getTime());
  const dow = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - dow);
  return localDate(x);
}

export function shuffle<T>(arr: T[], seed?: number): T[] {
  const a = [...arr];
  let s = seed ?? Math.floor(Math.random() * 2 ** 31);
  const rand = () => {
    s = (s * 1103515245 + 12345) % 2 ** 31;
    return s / 2 ** 31;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function pct(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "–";
  return `${Math.round(n * 100)}%`;
}

export function formatMinutes(sec: number): string {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}

export function cn(...c: (string | false | null | undefined)[]): string {
  return c.filter(Boolean).join(" ");
}

export function groupBy<T>(arr: T[], key: (t: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const t of arr) (out[key(t)] ??= []).push(t);
  return out;
}
