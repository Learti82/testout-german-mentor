import type { DB, Exercise } from "./types";
import { hashString, localDate, shuffle } from "./utils";

/**
 * Choose exercises so the learner doesn't see the same items every day:
 * never-seen first, then items answered wrong last time, then the least recently seen.
 */
export function pickExercises(db: DB, pool: Exercise[], count: number, opts: { exclude?: Set<string>; seed?: string } = {}): Exercise[] {
  const last = new Map<string, { at: string; score: number }>();
  for (const e of db.skill_evidence) {
    const prev = last.get(e.itemId);
    if (!prev || prev.at < e.at) last.set(e.itemId, { at: e.at, score: e.score });
  }
  const seed = hashString((opts.seed ?? "") + localDate());
  const candidates = shuffle(
    pool.filter((x) => !opts.exclude?.has(x.id)),
    seed,
  );
  const rank = (x: Exercise) => {
    const l = last.get(x.id);
    if (!l) return 0; // unseen
    const ageDays = (Date.now() - new Date(l.at).getTime()) / 86400000;
    if (l.score < 1 && ageDays >= 0.5) return 1; // got it wrong before
    if (ageDays < 1) return 4; // seen today
    return 2 + 1 / (1 + ageDays); // older first
  };
  return [...candidates].sort((a, b) => rank(a) - rank(b)).slice(0, count);
}
