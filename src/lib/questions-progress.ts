import { QUESTION_STAGES } from "@/content/questions";
import type { DB } from "./types";

/** Accuracy over the last 10 attempts on a question-trainer stage. */
export function stageStats(db: DB, stageIdx: number): { attempts: number; recentAccuracy: number | null } {
  const ids = new Set(QUESTION_STAGES[stageIdx].exercises.map((e) => e.id));
  const ev = db.skill_evidence.filter((e) => ids.has(e.itemId)).sort((a, b) => a.at.localeCompare(b.at));
  const last = ev.slice(-10);
  return { attempts: ev.length, recentAccuracy: last.length ? last.reduce((a, e) => a + e.score, 0) / last.length : null };
}

export const STAGE_PASS = 0.8;
export const STAGE_MIN_ATTEMPTS = 8;

export function stageUnlocked(db: DB, idx: number): boolean {
  if (idx === 0) return true;
  const prev = stageStats(db, idx - 1);
  return stageUnlocked(db, idx - 1) && prev.attempts >= STAGE_MIN_ATTEMPTS && (prev.recentAccuracy ?? 0) >= STAGE_PASS;
}

/** Highest unlocked stage = the one to practise. */
export function questionStageIndex(db: DB): number {
  let i = 0;
  while (i + 1 < QUESTION_STAGES.length && stageUnlocked(db, i + 1)) i++;
  return i;
}
