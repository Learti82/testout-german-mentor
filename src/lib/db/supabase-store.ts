import type { SupabaseClient } from "@supabase/supabase-js";
import type { DB, TableName } from "../types";
import { TABLE_NAMES, rowFromDb, rowToDb } from "./tables";
import type { Store } from "./store";

/** Persistent storage in Supabase Postgres. Rows are scoped by RLS to the signed-in user. */
export class SupabaseStore implements Store {
  readonly kind = "supabase" as const;
  constructor(private client: SupabaseClient) {}

  async loadAll(): Promise<Partial<DB>> {
    const db: Record<string, unknown[]> = {};
    await Promise.all(
      TABLE_NAMES.map(async (t) => {
        const rows: Record<string, unknown>[] = [];
        // page through in chunks of 1000 (PostgREST default limit)
        for (let from = 0; ; from += 1000) {
          const { data, error } = await this.client.from(t).select("*").range(from, from + 999);
          if (error) throw new Error(`Failed to load ${t}: ${error.message}`);
          rows.push(...(data ?? []));
          if (!data || data.length < 1000) break;
        }
        db[t] = rows.map((r) => rowFromDb(t, r));
      }),
    );
    return db as Partial<DB>;
  }

  async upsert(table: TableName, rows: object[]) {
    if (!rows.length) return;
    const payload = rows.map((r) => rowToDb(table, r));
    for (let i = 0; i < payload.length; i += 500) {
      const { error } = await this.client
        .from(table)
        .upsert(payload.slice(i, i + 500), { onConflict: "user_id,id" });
      if (error) throw new Error(`Failed to save ${table}: ${error.message}`);
    }
  }

  async remove(table: TableName, ids: string[]) {
    if (!ids.length) return;
    const { error } = await this.client.from(table).delete().in("id", ids);
    if (error) throw new Error(`Failed to delete from ${table}: ${error.message}`);
  }

  async clearAll() {
    for (const t of TABLE_NAMES) {
      const { error } = await this.client.from(t).delete().neq("id", "");
      if (error) throw new Error(`Failed to clear ${t}: ${error.message}`);
    }
  }
}
