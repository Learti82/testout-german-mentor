"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { seedVocabulary } from "@/content/vocabulary";
import { type AiStatus, engineStatus, subscribeEngine } from "@/lib/ai/engine";
import { type Changes, applyChanges } from "@/lib/db/changes";
import { LocalStore } from "@/lib/db/local-store";
import { emptyDb } from "@/lib/db/store";
import { TABLE_NAMES } from "@/lib/db/tables";
import { estimateLevel } from "@/lib/level";
import { initialProfile, translationLevel } from "@/lib/profile";
import { newCard } from "@/lib/srs";
import type { DB, Profile, TableName, TranslationLevel } from "@/lib/types";
import { nowIso } from "@/lib/utils";

interface DataCtx {
  db: DB;
  ready: boolean;
  error: string | null;
  /** Browser asked to keep data even when disk is low */
  persisted: boolean | null;
  ai: AiStatus | null;
  profile: Profile;
  translation: TranslationLevel;
  commit: (changes: Changes) => Promise<void>;
  remove: (table: TableName, ids: string[]) => Promise<void>;
  replaceAll: (db: DB) => Promise<void>;
  resetAll: () => Promise<void>;
  refreshAi: () => Promise<void>;
}

const Ctx = createContext<DataCtx | null>(null);
const store = new LocalStore();

/** Keep localStorage small: the evidence log is only needed for the last months. */
const MAX_ROWS: Partial<Record<TableName, number>> = { skill_evidence: 6000, conversations: 150, learning_sessions: 3000 };

function seed(): Changes {
  const vocab = seedVocabulary();
  return { profile: [initialProfile()], vocabulary: vocab, srs_cards: vocab.map((w) => newCard("vocab", w.id)) };
}

function normalize(partial: Partial<DB>): DB {
  const db = emptyDb();
  for (const t of TABLE_NAMES) (db as unknown as Record<string, unknown[]>)[t] = (partial[t] as unknown[]) ?? [];
  return db;
}

function sortKey(r: Record<string, unknown>): string {
  return String(r.at ?? r.updatedAt ?? r.startedAt ?? r.createdAt ?? "");
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB>(emptyDb());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ai, setAi] = useState<AiStatus | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const dbRef = useRef(db);
  dbRef.current = db;

  const load = useCallback(async () => {
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

  const refreshAi = useCallback(async () => setAi(await engineStatus()), []);

  useEffect(() => {
    void load();
    void refreshAi();
    // Ask the browser not to evict our data (best effort).
    navigator.storage?.persist?.().then(setPersisted).catch(() => setPersisted(false));
    // engine state changes (download finished, model loaded) → refresh availability
    let last = "";
    return subscribeEngine((s) => {
      if (s.phase !== last && (s.phase === "ready" || s.phase === "error" || s.phase === "idle")) void refreshAi();
      last = s.phase;
    });
  }, [load, refreshAi]);

  const commit = useCallback(async (changes: Changes) => {
    setDb((prev) => applyChanges(prev, changes));
    try {
      for (const [t, rows] of Object.entries(changes) as [TableName, object[]][]) {
        if (!rows?.length) continue;
        await store.upsert(t, rows);
        const max = MAX_ROWS[t];
        const current = dbRef.current[t] as unknown as Record<string, unknown>[];
        if (max && current.length + rows.length > max * 1.1) {
          const all = [...current].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
          const drop = all.slice(0, all.length - max).map((r) => String(r.id));
          await store.remove(t, drop);
          setDb((prev) => ({ ...prev, [t]: (prev[t] as { id: string }[]).filter((r) => !drop.includes(r.id)) }));
        }
      }
    } catch (e) {
      setError(
        e instanceof DOMException && e.name === "QuotaExceededError"
          ? "Hapësira e shfletuesit është plot. Eksporto të dhënat te Cilësimet."
          : `Ruajtja dështoi: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }, []);

  const remove = useCallback(async (table: TableName, ids: string[]) => {
    setDb((prev) => ({ ...prev, [table]: (prev[table] as { id: string }[]).filter((r) => !ids.includes(r.id)) }));
    await store.remove(table, ids);
  }, []);

  const replaceAll = useCallback(
    async (next: DB) => {
      await store.clearAll();
      for (const t of TABLE_NAMES) await store.upsert(t, (next[t] ?? []) as object[]);
      await load();
    },
    [load],
  );

  const resetAll = useCallback(async () => {
    await store.clearAll();
    await load();
  }, [load]);

  const profile = db.profile[0] ?? initialProfile();
  const working = useMemo(() => estimateLevel(db).working, [db]);

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
    persisted,
    ai,
    profile,
    translation: translationLevel(profile, working),
    commit,
    remove,
    replaceAll,
    resetAll,
    refreshAi,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useData(): DataCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useData outside DataProvider");
  return c;
}

export function useUpdateProfile() {
  const { commit, profile } = useData();
  return (patch: Partial<Profile>) => commit({ profile: [{ ...profile, ...patch, updatedAt: nowIso() }] });
}
