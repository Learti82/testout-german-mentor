import type { DB, TableName } from "../types";

/** A batch of upserts across tables. */
export type Changes = { [K in TableName]?: DB[K] };

export function mergeChanges(...all: Changes[]): Changes {
  const out: Record<string, { id: string }[]> = {};
  for (const c of all) {
    for (const [t, rows] of Object.entries(c) as [TableName, { id: string }[]][]) {
      if (!rows?.length) continue;
      const map = new Map((out[t] ?? []).map((r) => [r.id, r]));
      for (const r of rows) map.set(r.id, r);
      out[t] = [...map.values()];
    }
  }
  return out as Changes;
}

/** Apply changes to an in-memory DB (pure). */
export function applyChanges(db: DB, changes: Changes): DB {
  const next = { ...db } as Record<TableName, { id: string }[]>;
  for (const [t, rows] of Object.entries(changes) as [TableName, { id: string }[]][]) {
    if (!rows?.length) continue;
    const map = new Map(next[t].map((r) => [r.id, r]));
    for (const r of rows) map.set(r.id, r);
    next[t] = [...map.values()];
  }
  return next as unknown as DB;
}
