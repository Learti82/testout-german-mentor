import type { TableName } from "../types";

/**
 * Single source of truth for the database schema.
 * Keys are camelCase TypeScript field names; they are stored as snake_case columns.
 * `scripts/gen-sql.ts` generates supabase/migrations/0001_init.sql from this file,
 * and a test verifies the committed migration is in sync.
 */
export type ColType = "text" | "int" | "real" | "bool" | "timestamptz" | "jsonb" | "text[]";

export const TABLES: Record<TableName, Record<string, ColType>> = {
  profile: {
    id: "text",
    displayName: "text",
    nativeLanguage: "text",
    currentLevelClaimed: "text",
    targetLevel: "text",
    longTermGoal: "text",
    preferences: "text[]",
    knownWeaknesses: "text[]",
    dailyMinutes: "int",
    translationMode: "text",
    ttsRate: "real",
    theme: "text",
    aiModelOverride: "text",
    onboardingCompleted: "bool",
    placementCompletedAt: "timestamptz",
    placementLevel: "text",
    createdAt: "timestamptz",
    updatedAt: "timestamptz",
  },
  learning_sessions: {
    id: "text",
    type: "text",
    startedAt: "timestamptz",
    endedAt: "timestamptz",
    durationSec: "int",
    itemsTotal: "int",
    itemsCorrect: "int",
    score: "real",
    topicIds: "text[]",
    summary: "text",
    details: "jsonb",
  },
  vocabulary: {
    id: "text",
    german: "text",
    albanian: "text",
    article: "text",
    plural: "text",
    partOfSpeech: "text",
    example: "text",
    exampleSq: "text",
    level: "text",
    difficulty: "int",
    tags: "text[]",
    status: "text",
    statusManual: "bool",
    source: "text",
    createdAt: "timestamptz",
  },
  srs_cards: {
    id: "text",
    itemType: "text",
    itemId: "text",
    ease: "real",
    intervalDays: "real",
    repetitions: "int",
    lapses: "int",
    dueAt: "timestamptz",
    lastReviewedAt: "timestamptz",
    totalReviews: "int",
    totalCorrect: "int",
    history: "jsonb",
  },
  grammar_progress: {
    id: "text",
    topicId: "text",
    status: "text",
    lessonViewedAt: "timestamptz",
    exerciseAttempts: "int",
    exerciseCorrect: "int",
    testAttempts: "int",
    testBestScore: "real",
    scoreHistory: "jsonb",
    lastPracticedAt: "timestamptz",
    nextReviewAt: "timestamptz",
  },
  mistakes: {
    id: "text",
    original: "text",
    corrected: "text",
    explanationSq: "text",
    category: "text",
    topicId: "text",
    label: "text",
    count: "int",
    firstSeenAt: "timestamptz",
    lastSeenAt: "timestamptz",
    dates: "jsonb",
    source: "text",
    correctStreak: "int",
    resolved: "bool",
  },
  conversations: {
    id: "text",
    mode: "text",
    scenarioId: "text",
    title: "text",
    startedAt: "timestamptz",
    updatedAt: "timestamptz",
    messages: "jsonb",
    summary: "text",
    evaluation: "jsonb",
  },
  daily_goals: {
    id: "text",
    date: "text",
    tasks: "jsonb",
    completedTaskIds: "text[]",
    minutesTarget: "int",
    recommendation: "jsonb",
    mentorMessage: "text",
    generatedBy: "text",
    createdAt: "timestamptz",
  },
  weekly_assessments: {
    id: "text",
    weekStart: "text",
    takenAt: "timestamptz",
    sectionScores: "jsonb",
    overall: "real",
    estimatedLevel: "text",
    report: "jsonb",
    details: "jsonb",
  },
  mentor_memory: {
    id: "text",
    kind: "text",
    content: "text",
    topicId: "text",
    importance: "int",
    createdAt: "timestamptz",
  },
  skill_evidence: {
    id: "text",
    skill: "text",
    level: "text",
    itemId: "text",
    topicId: "text",
    score: "real",
    at: "timestamptz",
    source: "text",
  },
  study_plans: {
    id: "text",
    createdAt: "timestamptz",
    startsOn: "text",
    days: "jsonb",
    rationale: "text",
    generatedBy: "text",
  },
};

export const TABLE_NAMES = Object.keys(TABLES) as TableName[];

export function toSnake(s: string): string {
  return s.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
}
export function toCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

/** Convert a TS row to a DB row (snake_case), dropping unknown fields. */
export function rowToDb(table: TableName, row: object): Record<string, unknown> {
  const cols = TABLES[table];
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(cols)) {
    const v = (row as Record<string, unknown>)[key];
    out[toSnake(key)] = v === undefined ? null : v;
  }
  return out;
}

export function rowFromDb<T>(table: TableName, row: Record<string, unknown>): T {
  const cols = TABLES[table];
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(cols)) out[key] = row[toSnake(key)];
  return out as T;
}

const SQL_TYPES: Record<ColType, string> = {
  text: "text",
  int: "integer",
  real: "double precision",
  bool: "boolean",
  timestamptz: "timestamptz",
  jsonb: "jsonb",
  "text[]": "text[]",
};

export function generateSql(): string {
  const parts: string[] = [
    "-- German Mentor schema. GENERATED by `npm run gen:sql` from src/lib/db/tables.ts. Do not edit by hand.",
    "-- Every table is private per user and protected by Row Level Security.",
    "",
  ];
  for (const table of TABLE_NAMES) {
    const cols = TABLES[table];
    const lines = [`  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade`];
    for (const [key, type] of Object.entries(cols)) {
      lines.push(`  ${toSnake(key)} ${SQL_TYPES[type]}${key === "id" ? " not null" : ""}`);
    }
    lines.push(`  primary key (user_id, id)`);
    parts.push(`create table if not exists public.${table} (\n${lines.join(",\n")}\n);`);
    parts.push(`alter table public.${table} enable row level security;`);
    parts.push(
      `drop policy if exists "${table}_owner" on public.${table};`,
      `create policy "${table}_owner" on public.${table} for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());`,
      "",
    );
  }
  parts.push("create index if not exists skill_evidence_at_idx on public.skill_evidence (user_id, at);");
  parts.push("create index if not exists srs_cards_due_idx on public.srs_cards (user_id, due_at);");
  parts.push("create index if not exists learning_sessions_started_idx on public.learning_sessions (user_id, started_at);");
  return parts.join("\n") + "\n";
}
