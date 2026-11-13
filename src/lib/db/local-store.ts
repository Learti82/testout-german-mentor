import type { DB, TableName } from "../types";
import { TABLE_NAMES } from "./tables";
import type { Store } from "./store";

const PREFIX = "german-mentor:v1:";

function read(table: TableName): { id: string }[] {
  try {
    const raw = localStorage.getItem(PREFIX + table);
    return raw ? (JSON.parse(raw) as { id: string }[]) : [];
  } catch {
    return [];
  }
}

function write(table: TableName, rows: object[]) {
  localStorage.setItem(PREFIX + table, JSON.stringify(rows));
}

/** Browser-only storage. Used when Supabase is not configured or the user is signed out. */
export class LocalStore implements Store {
  readonly kind = "local" as const;

  async loadAll(): Promise<Partial<DB>> {
    const db: Record<string, unknown[]> = {};
    for (const t of TABLE_NAMES) db[t] = read(t);
    return db as Partial<DB>;
  }

  async upsert(table: TableName, rows: object[]) {
    const existing = read(table);
    const byId = new Map(existing.map((r) => [r.id, r]));
    for (const r of rows as { id: string }[]) byId.set(r.id, r);
    write(table, [...byId.values()]);
  }

  async remove(table: TableName, ids: string[]) {
    const set = new Set(ids);
    write(table, read(table).filter((r) => !set.has(r.id)));
  }

  async clearAll() {
    for (const t of TABLE_NAMES) localStorage.removeItem(PREFIX + t);
  }
}
