import { effectiveStatus } from "./srs";
import type { DB, VocabStatus } from "./types";
import { addDays, daysBetween, localDate, weekStart } from "./utils";

export function activeDays(db: DB): Set<string> {
  return new Set(db.learning_sessions.filter((s) => s.durationSec >= 60 || s.itemsTotal > 0).map((s) => localDate(s.startedAt)));
}

export function streak(db: DB, now = new Date()): number {
  const days = activeDays(db);
  let d = new Date(now);
  if (!days.has(localDate(d))) d = addDays(d, -1); // today not done yet — streak still alive
  let n = 0;
  while (days.has(localDate(d))) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export function vocabCounts(db: DB): Record<VocabStatus, number> {
  const cards = new Map(db.srs_cards.map((c) => [c.itemId, c]));
  const out: Record<VocabStatus, number> = { new: 0, learning: 0, difficult: 0, known: 0, mastered: 0 };
  for (const w of db.vocabulary) out[effectiveStatus(w, cards.get(w.id))]++;
  return out;
}

export function speakingSeconds(db: DB): number {
  return db.learning_sessions
    .filter((s) => s.type === "speaking" || s.type === "callcenter")
    .reduce((a, s) => a + s.durationSec, 0);
}

export function minutesToday(db: DB, now = new Date()): number {
  const today = localDate(now);
  return Math.round(
    db.learning_sessions.filter((s) => localDate(s.startedAt) === today).reduce((a, s) => a + s.durationSec, 0) / 60,
  );
}

export interface WeekPoint {
  week: string;
  minutes: number;
  sessions: number;
  accuracy: number | null;
  mistakes: number;
  wordsAdded: number;
}

export function weeklySeries(db: DB, weeks = 8, now = new Date()): WeekPoint[] {
  const out: WeekPoint[] = [];
  const thisWeek = weekStart(now);
  for (let i = weeks - 1; i >= 0; i--) {
    const ws = localDate(addDays(thisWeek + "T12:00:00", -7 * i));
    const inWeek = (iso: string) => weekStart(iso) === ws;
    const sessions = db.learning_sessions.filter((s) => inWeek(s.startedAt));
    const ev = db.skill_evidence.filter((e) => inWeek(e.at));
    out.push({
      week: ws,
      minutes: Math.round(sessions.reduce((a, s) => a + s.durationSec, 0) / 60),
      sessions: sessions.length,
      accuracy: ev.length ? ev.reduce((a, e) => a + e.score, 0) / ev.length : null,
      mistakes: db.mistakes.reduce((n, m) => n + m.dates.filter(inWeek).length, 0),
      wordsAdded: db.vocabulary.filter((w) => w.source !== "seed" && inWeek(w.createdAt)).length,
    });
  }
  return out;
}

export function daysSince(iso: string | null | undefined, now = new Date()): number | null {
  return iso ? daysBetween(iso, now) : null;
}
