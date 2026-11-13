"use client";

import type { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { seedVocabulary } from "@/content/vocabulary";
import { type AiStatus, fetchAiStatus } from "@/lib/ai/client";
import { type Changes, applyChanges } from "@/lib/db/changes";
import { LocalStore } from "@/lib/db/local-store";
import { type Store, emptyDb } from "@/lib/db/store";
import { SupabaseStore } from "@/lib/db/supabase-store";
import { TABLE_NAMES } from "@/lib/db/tables";
import { estimateLevel } from "@/lib/level";
import { initialProfile, translationLevel } from "@/lib/profile";
import { newCard } from "@/lib/srs";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import type { DB, Profile, TableName, TranslationLevel } from "@/lib/types";
import { nowIso } from "@/lib/utils";

interface DataCtx {
  db: DB;
  ready: boolean;
  error: string | null;
  mode: "local" | "supabase";
  session: Session | null;
  ai: AiStatus | null;
  profile: Profile;
  translation: TranslationLevel;
  commit: (changes: Changes) => Promise<void>;
  remove: (table: TableName, ids: string[]) => Promise<void>;
  replaceAll: (db: DB) => Promise<void>;
  resetAll: () => Promise<void>;
  refreshAi: () => Promise<void>;
  reload: () => Promise<void>;
}

const Ctx = createContext<DataCtx | null>(null);

function seed(): Changes {
  const vocab = seedVocabulary();
  return { profile: [initialProfile()], vocabulary: vocab, srs_cards: vocab.map((w) => newCard("vocab", w.id)) };
}

function normalize(partial: Partial<DB>): DB {
  const db = emptyDb();
  for (const t of TABLE_NAMES) (db as unknown as Record<string, unknown[]>)[t] = (partial[t] as unknown[]) ?? [];
  return db;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB>(emptyDb());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [ai, setAi] = useState<AiStatus | null>(null);
  const storeRef = useRef<Store>(new LocalStore());
  const dbRef = useRef(db);
  dbRef.current = db;

  const load = useCallback(async (store: Store) => {
    storeRef.current = store;
    setReady(false);
    try {
      let loaded = normalize(await store.loadAll());
      if (!loaded.profile.length) {
        const s = seed();
        await Promise.all(Object.entries(s).map(([t, rows]) => store.upsert(t as TableName, rows as object[])));
        loaded = applyChanges(loaded, s);
      }
      setDb(loaded);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    fetchAiStatus().then(setAi);
    const sb = getSupabase();
    if (!sb) {
      load(new LocalStore());
      return;
    }
    let current: string | null | undefined;
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      current = data.session?.user.id ?? null;
      load(data.session ? new SupabaseStore(sb) : new LocalStore());
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      const id = s?.user.id ?? null;
      if (current !== undefined && id !== current) {
        current = id;
        load(s ? new SupabaseStore(sb) : new LocalStore());
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const commit = useCallback(async (changes: Changes) => {
    setDb((prev) => applyChanges(prev, changes));
    try {
      await Promise.all(
        Object.entries(changes)
          .filter(([, rows]) => (rows as unknown[])?.length)
          .map(([t, rows]) => storeRef.current.upsert(t as TableName, rows as object[])),
      );
    } catch (e) {
      setError(`Saving failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, []);

  const remove = useCallback(async (table: TableName, ids: string[]) => {
    setDb((prev) => ({ ...prev, [table]: (prev[table] as { id: string }[]).filter((r) => !ids.includes(r.id)) }));
    try {
      await storeRef.current.remove(table, ids);
    } catch (e) {
      setError(`Delete failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }, []);

  const replaceAll = useCallback(
    async (next: DB) => {
      await storeRef.current.clearAll();
      await Promise.all(TABLE_NAMES.map((t) => storeRef.current.upsert(t, next[t] as object[])));
      await load(storeRef.current);
    },
    [load],
  );

  const resetAll = useCallback(async () => {
    await storeRef.current.clearAll();
    await load(storeRef.current);
  }, [load]);

  const profile = db.profile[0] ?? initialProfile();
  const working = useMemo(() => estimateLevel(db).working, [db]);

  // apply theme
  useEffect(() => {
    const t = profile.theme;
    try {
      localStorage.setItem("german-mentor:theme", t);
    } catch {}
    const root = document.documentElement;
    if (t === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", t);
  }, [profile.theme]);

  const value: DataCtx = {
    db,
    ready,
    error,
    mode: storeRef.current.kind,
    session,
    ai,
    profile,
    translation: translationLevel(profile, working),
    commit,
    remove,
    replaceAll,
    resetAll,
    refreshAi: async () => setAi(await fetchAiStatus()),
    reload: () => load(storeRef.current),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData(): DataCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useData outside DataProvider");
  return c;
}

/** Convenience: update the profile row. */
export function useUpdateProfile() {
  const { commit, profile } = useData();
  return (patch: Partial<Profile>) => commit({ profile: [{ ...profile, ...patch, updatedAt: nowIso() }] });
}

export { supabaseConfigured };
