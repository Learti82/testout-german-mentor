// Records learning activity into structured tables: skill evidence, grammar progress,
// mistakes and sessions. This is the "memory" the mentor reasons over.

import { TOPIC_BY_ID } from "@/content/grammar";
import type { CheckVerdict } from "./answer-check";
import type { Changes } from "./db/changes";
import { mergeChanges } from "./db/changes";
import { applyPractice, progressFor, withStatus } from "./grammar-progress";
import { applyMistakePractice, recordCorrections } from "./mistakes";
import type { Correction, DB, Exercise, LearningSession, MistakeCategory, SessionType, SkillEvidence } from "./types";
import { nowIso, uid } from "./utils";

export interface ExerciseResult {
  exercise: Exercise;
  answer: string;
  /** 0..1 */
  score: number;
  verdict: CheckVerdict | "self";
  /** Optional AI-provided corrections for free answers */
  corrections?: Correction[];
  at: string;
}

function categoryFor(verdict: ExerciseResult["verdict"], ex: Exercise): MistakeCategory {
  if (verdict === "word_order" || ex.type === "order") return "word_order";
  if (verdict === "almost") return "spelling";
  if (ex.skill === "vocabulary") return "vocabulary";
  return "grammar";
}

/** Build a readable "original sentence" for the mistake log. */
export function originalSentence(ex: Exercise, answer: string): string {
  if ((ex.type === "fill" || ex.type === "mc") && ex.prompt.includes("___")) return ex.prompt.replace("___", answer).replace(/\s*\(.*?\)\s*$/, "");
  return answer;
}

export function expectedSentence(ex: Exercise): string {
  const right = ex.type === "mc" ? ex.options?.[ex.correctIndex ?? 0] ?? "" : ex.answers?.[0] ?? "";
  if ((ex.type === "fill" || ex.type === "mc") && ex.prompt.includes("___")) return ex.prompt.replace("___", right).replace(/\s*\(.*?\)\s*$/, "");
  return right;
}

export function recordResults(db: DB, results: ExerciseResult[], source: SessionType | "exercise"): Changes {
  if (!results.length) return {};
  const evidence: SkillEvidence[] = results.map((r) => ({
    id: uid(),
    skill: r.exercise.skill,
    level: r.exercise.level,
    itemId: r.exercise.id,
    topicId: r.exercise.topicId,
    score: r.score,
    at: r.at,
    source,
  }));

  // grammar progress per topic
  const byTopic = new Map<string, { attempts: number; correct: number }>();
  for (const r of results) {
    if (!TOPIC_BY_ID[r.exercise.topicId]) continue;
    const t = byTopic.get(r.exercise.topicId) ?? { attempts: 0, correct: 0 };
    t.attempts += 1;
    t.correct += r.score >= 1 ? 1 : 0;
    byTopic.set(r.exercise.topicId, t);
  }
  let working = db;
  const progress = [...byTopic.entries()].map(([topicId, t]) => {
    const p = withStatus(working, applyPractice(progressFor(working, topicId), t.attempts, t.correct));
    working = { ...working, grammar_progress: [...working.grammar_progress.filter((g) => g.id !== p.id), p] };
    return p;
  });

  // mistakes from wrong answers (not for listening/reading comprehension MC)
  const corrections: Correction[] = [];
  for (const r of results) {
    if (r.score >= 1) continue;
    if (r.exercise.skill === "reading" || r.exercise.skill === "listening") continue;
    if (r.corrections?.length) {
      corrections.push(...r.corrections);
      continue;
    }
    if (r.verdict === "self" || !r.answer.trim()) continue;
    corrections.push({
      original: originalSentence(r.exercise, r.answer),
      corrected: expectedSentence(r.exercise),
      explanationSq: r.exercise.explanation ?? "",
      category: categoryFor(r.verdict, r.exercise),
      topicId: r.exercise.topicId,
      label: TOPIC_BY_ID[r.exercise.topicId]?.title ?? "",
    });
  }
  const mistakes = recordCorrections(db, corrections, source);

  // practice on items generated from past mistakes
  const practiced = results
    .filter((r) => r.exercise.id.startsWith("mistake:"))
    .map((r) => {
      const m = db.mistakes.find((x) => `mistake:${x.id}` === r.exercise.id);
      return m ? applyMistakePractice(m, r.score >= 1) : null;
    })
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  return mergeChanges({ skill_evidence: evidence, grammar_progress: progress }, { mistakes: practiced }, { mistakes });
}

export function makeSession(
  type: SessionType,
  startedAt: string,
  results: { score: number }[],
  extra: Partial<LearningSession> = {},
): LearningSession {
  const endedAt = nowIso();
  const total = results.length;
  const correct = results.filter((r) => r.score >= 1).length;
  const sum = results.reduce((a, r) => a + r.score, 0);
  return {
    id: uid(),
    type,
    startedAt,
    endedAt,
    durationSec: Math.max(0, Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000)),
    itemsTotal: total,
    itemsCorrect: correct,
    score: total ? sum / total : null,
    topicIds: [],
    summary: "",
    details: {},
    ...extra,
  };
}
