import type { DB, TableName } from "../types";

export interface Store {
  readonly kind: "local" | "supabase";
  loadAll(): Promise<Partial<DB>>;
  upsert(table: TableName, rows: object[]): Promise<void>;
  remove(table: TableName, ids: string[]): Promise<void>;
  clearAll(): Promise<void>;
}

export function emptyDb(): DB {
  return {
    profile: [],
    learning_sessions: [],
    vocabulary: [],
    srs_cards: [],
    grammar_progress: [],
    mistakes: [],
    conversations: [],
    daily_goals: [],
    weekly_assessments: [],
    mentor_memory: [],
    skill_evidence: [],
    study_plans: [],
  };
}
