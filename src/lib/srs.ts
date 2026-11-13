// Spaced repetition: an SM-2 variant tuned for language learning.
// - Wrong answers reset the interval and lower ease, so difficult words return often.
// - A word is only "known" after several successful spaced reviews and
//   only "mastered" after a long interval AND a strong track record — never after one correct answer.

import type { SrsCard, VocabStatus, VocabWord } from "./types";
import { addDays, nowIso } from "./utils";

export type Grade = 0 | 1 | 2 | 3; // again | hard | good | easy

export const GRADE_LABELS: Record<Grade, { de: string; sq: string }> = {
  0: { de: "Nochmal", sq: "Përsëri" },
  1: { de: "Schwer", sq: "E vështirë" },
  2: { de: "Gut", sq: "Mirë" },
  3: { de: "Leicht", sq: "E lehtë" },
};

export function newCard(itemType: SrsCard["itemType"], itemId: string, now = new Date()): SrsCard {
  return {
    id: `${itemType}:${itemId}`,
    itemType,
    itemId,
    ease: 2.3,
    intervalDays: 0,
    repetitions: 0,
    lapses: 0,
    dueAt: now.toISOString(),
    lastReviewedAt: null,
    totalReviews: 0,
    totalCorrect: 0,
    history: [],
  };
}

export function review(card: SrsCard, grade: Grade, now = new Date()): SrsCard {
  const c: SrsCard = { ...card, history: [...card.history, grade >= 2 ? 1 : 0].slice(-12) };
  c.totalReviews += 1;
  c.lastReviewedAt = now.toISOString();

  if (grade === 0) {
    c.lapses += 1;
    c.repetitions = 0;
    c.ease = Math.max(1.3, c.ease - 0.2);
    // see it again in ~10 minutes (same session) — stored as a fraction of a day
    c.intervalDays = 10 / (60 * 24);
  } else {
    c.totalCorrect += grade >= 2 ? 1 : 0;
    if (grade === 1) c.ease = Math.max(1.3, c.ease - 0.15);
    if (grade === 3) c.ease = Math.min(3.0, c.ease + 0.15);
    c.repetitions += 1;
    if (c.repetitions === 1) c.intervalDays = grade === 1 ? 0.5 : 1;
    else if (c.repetitions === 2) c.intervalDays = grade === 1 ? 2 : 3;
    else {
      const factor = grade === 1 ? 1.2 : grade === 3 ? c.ease * 1.3 : c.ease;
      c.intervalDays = Math.min(180, Math.max(c.intervalDays + 1, c.intervalDays * factor));
    }
  }
  const due = new Date(now.getTime() + c.intervalDays * 86400000);
  c.dueAt = due.toISOString();
  return c;
}

export function accuracy(card: SrsCard): number {
  return card.totalReviews ? card.totalCorrect / card.totalReviews : 0;
}

/** Status derived purely from review evidence. */
export function derivedStatus(card: SrsCard | undefined): VocabStatus {
  if (!card || card.totalReviews === 0) return "new";
  const recent = card.history.slice(-5);
  const recentAcc = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
  if (card.lapses >= 3 && recentAcc < 0.8) return "difficult";
  if (card.ease < 1.7) return "difficult";
  if (card.intervalDays >= 21 && card.repetitions >= 5 && card.totalReviews >= 6 && accuracy(card) >= 0.85) return "mastered";
  if (card.intervalDays >= 7 && card.repetitions >= 3) return "known";
  return "learning";
}

/**
 * Combine the learner's manual status with the algorithm.
 * Manual "difficult" stays until evidence clearly improves; manual "mastered"/"known" is respected,
 * but if the learner then fails the word twice in a row it drops back to "learning".
 */
export function effectiveStatus(word: VocabWord, card: SrsCard | undefined): VocabStatus {
  const auto = derivedStatus(card);
  if (!word.statusManual) return auto;
  const last2 = card?.history.slice(-2) ?? [];
  const failedTwice = last2.length === 2 && last2.every((x) => x === 0);
  if ((word.status === "mastered" || word.status === "known") && failedTwice) return "learning";
  return word.status;
}

/** Applying a manual status also nudges the schedule so behaviour matches the label. */
export function applyManualStatus(card: SrsCard, status: VocabStatus, now = new Date()): SrsCard {
  const c = { ...card };
  switch (status) {
    case "difficult":
      c.ease = Math.max(1.3, Math.min(c.ease, 1.8));
      c.dueAt = now.toISOString();
      c.intervalDays = 0;
      c.repetitions = 0;
      break;
    case "new":
    case "learning":
      c.dueAt = now.toISOString();
      c.intervalDays = 0;
      break;
    case "known":
      c.intervalDays = Math.max(c.intervalDays, 7);
      c.dueAt = addDays(now, 7).toISOString();
      break;
    case "mastered":
      // still verify later — mastered words come back after a month
      c.intervalDays = Math.max(c.intervalDays, 30);
      c.dueAt = addDays(now, 30).toISOString();
      break;
  }
  return c;
}

export function isDue(card: SrsCard, now = new Date()): boolean {
  return new Date(card.dueAt).getTime() <= now.getTime();
}

/** Order due cards: overdue difficult words first, then by due date. New words limited per day. */
export function dueQueue(cards: SrsCard[], opts: { now?: Date; newLimit?: number; max?: number } = {}): SrsCard[] {
  const now = opts.now ?? new Date();
  const due = cards.filter((c) => isDue(c, now));
  const reviewed = due.filter((c) => c.totalReviews > 0).sort((a, b) => a.ease - b.ease || a.dueAt.localeCompare(b.dueAt));
  const fresh = due.filter((c) => c.totalReviews === 0).slice(0, opts.newLimit ?? 5);
  return [...reviewed, ...fresh].slice(0, opts.max ?? 30);
}

export { nowIso };
