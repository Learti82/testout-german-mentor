// Builds the mentor's persistent memory from structured records (not from chat history).
// This compact summary is sent with every AI request so the mentor "knows" the learner.

import { TOPIC_BY_ID } from "@/content/grammar";
import { computeStatus } from "./grammar-progress";
import { estimateLevel } from "./level";
import { translationLevel } from "./profile";
import { effectiveStatus } from "./srs";
import type { DB } from "./types";
import { rankWeaknesses } from "./weakness";

export interface MentorContext {
  level: string;
  workingLevel: string;
  translation: string;
  goal: string;
  weakTopics: string[];
  topMistakes: string[];
  vocabularyLearning: string[];
  vocabularyKnown: string[];
  topicsStatus: string[];
  notes: string[];
  lastSessions: string[];
}

export function buildMentorContext(db: DB, now = new Date()): MentorContext {
  const est = estimateLevel(db, now);
  const profile = db.profile[0];
  const cards = new Map(db.srs_cards.map((c) => [c.itemId, c]));
  const words = db.vocabulary.map((w) => ({ w, s: effectiveStatus(w, cards.get(w.id)) }));
  return {
    level: est.label + (est.provisional ? " (provisional)" : ""),
    workingLevel: est.working,
    translation: translationLevel(profile, est.working),
    goal: profile?.longTermGoal ?? "Work in a German call center",
    weakTopics: rankWeaknesses(db, now)
      .slice(0, 5)
      .filter((w) => w.score > 0)
      .map((w) => `${TOPIC_BY_ID[w.topicId]?.title} [${w.topicId}] (${w.reasons.join("; ")})`),
    topMistakes: db.mistakes
      .filter((m) => !m.resolved)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((m) => `"${m.original}" → "${m.corrected}" (${m.label || m.category}, ${m.count}x)`),
    vocabularyLearning: words
      .filter((x) => x.s === "new" || x.s === "learning" || x.s === "difficult")
      .slice(0, 30)
      .map((x) => `${x.w.article ? x.w.article + " " : ""}${x.w.german}${x.s === "difficult" ? " (difficult)" : ""}`),
    vocabularyKnown: words
      .filter((x) => x.s === "known" || x.s === "mastered")
      .slice(0, 40)
      .map((x) => x.w.german),
    topicsStatus: Object.values(TOPIC_BY_ID)
      .map((t) => ({ t, s: computeStatus(db, t.id, now) }))
      .filter((x) => x.s !== "locked" && x.s !== "available")
      .map((x) => `${x.t.id}: ${x.s}`),
    notes: db.mentor_memory
      .slice()
      .sort((a, b) => b.importance - a.importance || b.createdAt.localeCompare(a.createdAt))
      .slice(0, 12)
      .map((m) => m.content),
    lastSessions: db.learning_sessions
      .slice()
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, 5)
      .map((s) => `${s.startedAt.slice(0, 10)} ${s.type}${s.score !== null ? ` score ${Math.round(s.score * 100)}%` : ""}${s.summary ? ` – ${s.summary}` : ""}`),
  };
}
