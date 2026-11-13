import { GRAMMAR_TOPICS, TOPIC_BY_ID, topicsByLevel } from "@/content/grammar";
import type { CEFR, DB, GrammarProgress, GrammarStatus, Profile } from "./types";
import { CEFR_LEVELS } from "./types";
import { addDays, daysBetween, localDate, nowIso } from "./utils";

export const UNLOCK_THRESHOLD = 0.6;
export const DEMONSTRATED_SCORE = 0.8;

export function emptyProgress(topicId: string): GrammarProgress {
  return {
    id: topicId,
    topicId,
    status: "available",
    lessonViewedAt: null,
    exerciseAttempts: 0,
    exerciseCorrect: 0,
    testAttempts: 0,
    testBestScore: 0,
    scoreHistory: [],
    lastPracticedAt: null,
    nextReviewAt: null,
  };
}

export function progressFor(db: DB, topicId: string): GrammarProgress {
  return db.grammar_progress.find((g) => g.topicId === topicId) ?? emptyProgress(topicId);
}

function isDemonstrated(p: GrammarProgress) {
  return p.testBestScore >= DEMONSTRATED_SCORE;
}

/** Which CEFR levels are open. A level opens when 60% of the previous level is demonstrated, or the placement test showed it. */
export function unlockedLevels(db: DB): CEFR[] {
  const profile: Profile | undefined = db.profile[0];
  const placementIdx = profile?.placementLevel ? CEFR_LEVELS.indexOf(profile.placementLevel) : 0;
  const open: CEFR[] = ["A1"];
  for (let i = 1; i < CEFR_LEVELS.length; i++) {
    const prev = topicsByLevel(CEFR_LEVELS[i - 1]);
    const demonstrated = prev.filter((t) => isDemonstrated(progressFor(db, t.id))).length;
    if (i <= placementIdx || demonstrated / prev.length >= UNLOCK_THRESHOLD) open.push(CEFR_LEVELS[i]);
    else break;
  }
  return open;
}

export function levelUnlockProgress(db: DB, level: CEFR): { demonstrated: number; total: number; needed: number } {
  const topics = topicsByLevel(level);
  const demonstrated = topics.filter((t) => isDemonstrated(progressFor(db, t.id))).length;
  return { demonstrated, total: topics.length, needed: Math.ceil(topics.length * UNLOCK_THRESHOLD) };
}

export function recentTopicMistakes(db: DB, topicId: string, days = 14, now = new Date()): number {
  return db.mistakes
    .filter((m) => m.topicId === topicId)
    .reduce((n, m) => n + m.dates.filter((d) => daysBetween(d, now) <= days).length, 0);
}

export function computeStatus(db: DB, topicId: string, now = new Date()): GrammarStatus {
  const topic = TOPIC_BY_ID[topicId];
  if (!topic) return "available";
  if (!unlockedLevels(db).includes(topic.level)) return "locked";
  const p = progressFor(db, topicId);
  if (isDemonstrated(p)) {
    const firstDemo = p.scoreHistory.find((s) => s.score >= DEMONSTRATED_SCORE && s.kind !== "practice");
    const laterPasses = new Set(
      p.scoreHistory
        .filter(
          (s) =>
            s.kind !== "practice" &&
            s.score >= DEMONSTRATED_SCORE &&
            firstDemo &&
            daysBetween(firstDemo.at, s.at) >= 3,
        )
        .map((s) => localDate(s.at)),
    );
    if (laterPasses.size >= 2 && recentTopicMistakes(db, topicId, 14, now) < 2) return "mastered";
    return "demonstrated";
  }
  if (p.exerciseAttempts >= 5) return "practiced";
  if (p.lessonViewedAt) return "studied";
  return "available";
}

export function needsRevision(db: DB, topicId: string, now = new Date()): boolean {
  const p = progressFor(db, topicId);
  const status = computeStatus(db, topicId, now);
  if (status === "locked" || status === "available") return false;
  if (p.nextReviewAt && new Date(p.nextReviewAt) <= now) return true;
  if ((status === "demonstrated" || status === "mastered") && recentTopicMistakes(db, topicId, 14, now) >= 3) return true;
  const last = p.scoreHistory.filter((s) => s.kind !== "practice").at(-1);
  return Boolean(last && last.score < 0.6);
}

function reviewInterval(p: GrammarProgress, score: number): number {
  if (score < 0.6) return 1;
  if (score < DEMONSTRATED_SCORE) return 2;
  const passes = p.scoreHistory.filter((s) => s.kind !== "practice" && s.score >= DEMONSTRATED_SCORE).length;
  return [3, 7, 21, 45][Math.min(passes - 1, 3)] ?? 3;
}

export function markLessonViewed(db: DB, topicId: string): GrammarProgress {
  const p = progressFor(db, topicId);
  return p.lessonViewedAt ? p : { ...p, lessonViewedAt: nowIso() };
}

export function applyPractice(p: GrammarProgress, attempts: number, correct: number, at = nowIso()): GrammarProgress {
  return {
    ...p,
    exerciseAttempts: p.exerciseAttempts + attempts,
    exerciseCorrect: p.exerciseCorrect + correct,
    lastPracticedAt: at,
  };
}

/** Record a topic test or a spaced review (a test taken again later). */
export function applyTest(p: GrammarProgress, score: number, kind: "test" | "review", at = nowIso()): GrammarProgress {
  const next: GrammarProgress = {
    ...p,
    testAttempts: p.testAttempts + 1,
    testBestScore: Math.max(p.testBestScore, score),
    scoreHistory: [...p.scoreHistory, { at, score, kind }].slice(-30),
    lastPracticedAt: at,
  };
  next.nextReviewAt = addDays(at, reviewInterval(next, score)).toISOString();
  return next;
}

export function withStatus(db: DB, p: GrammarProgress): GrammarProgress {
  const merged = { ...db, grammar_progress: [...db.grammar_progress.filter((g) => g.id !== p.id), p] };
  return { ...p, status: computeStatus(merged, p.topicId) };
}

export function statusCounts(db: DB) {
  const counts: Record<GrammarStatus, number> = { locked: 0, available: 0, studied: 0, practiced: 0, demonstrated: 0, mastered: 0 };
  for (const t of GRAMMAR_TOPICS) counts[computeStatus(db, t.id)]++;
  return counts;
}

export const STATUS_LABEL: Record<GrammarStatus, { de: string; sq: string }> = {
  locked: { de: "Gesperrt", sq: "E kyçur" },
  available: { de: "Neu", sq: "E re" },
  studied: { de: "Gelernt", sq: "E studiuar" },
  practiced: { de: "Geübt", sq: "E ushtruar" },
  demonstrated: { de: "Verstanden", sq: "E kuptuar (e provuar)" },
  mastered: { de: "Beherrscht", sq: "E zotëruar" },
};

export const STATUS_TONE: Record<GrammarStatus, "neutral" | "info" | "warn" | "accent" | "good"> = {
  locked: "neutral",
  available: "neutral",
  studied: "info",
  practiced: "warn",
  demonstrated: "accent",
  mastered: "good",
};

