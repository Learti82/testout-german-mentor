import { TOPIC_BY_ID, matchTopic } from "@/content/grammar";
import { normalize } from "./answer-check";
import type { Correction, DB, Exercise, Mistake, MistakeCategory, SessionType } from "./types";
import { daysBetween, nowIso, uid } from "./utils";

export const CATEGORY_LABEL: Record<MistakeCategory, { de: string; sq: string }> = {
  grammar: { de: "Grammatik", sq: "Gramatikë" },
  word_order: { de: "Wortstellung", sq: "Renditja e fjalëve" },
  vocabulary: { de: "Wortschatz", sq: "Fjalor" },
  unnatural: { de: "Unnatürlich", sq: "Shprehje jo e natyrshme" },
  spelling: { de: "Rechtschreibung", sq: "Drejtshkrim" },
  pronunciation: { de: "Aussprache", sq: "Shqiptim" },
};

/** Same wrong sentence AND same correction = the same mistake. */
const mistakeKey = (original: string, corrected: string) => `${normalize(original)}=>${normalize(corrected)}`;

/** Merge new corrections into the mistakes table (same sentence → count++). Returns changed rows. */
export function recordCorrections(db: DB, corrections: Correction[], source: Mistake["source"], at = nowIso()): Mistake[] {
  const changed = new Map<string, Mistake>();
  for (const c of corrections) {
    if (!c.original?.trim() || !c.corrected?.trim()) continue;
    if (normalize(c.original) === normalize(c.corrected)) continue;
    const topicId = c.topicId && TOPIC_BY_ID[c.topicId] ? c.topicId : matchTopic(`${c.label} ${c.explanationSq}`);
    const key = mistakeKey(c.original, c.corrected);
    const existing = changed.get(key) ?? db.mistakes.find((m) => mistakeKey(m.original, m.corrected) === key);
    if (existing) {
      changed.set(key, {
        ...existing,
        count: existing.count + 1,
        lastSeenAt: at,
        dates: [...existing.dates, at].slice(-50),
        correctStreak: 0,
        resolved: false,
        explanationSq: c.explanationSq || existing.explanationSq,
        topicId: existing.topicId || topicId,
        label: existing.label || c.label,
      });
    } else {
      changed.set(key, {
        id: uid(),
        original: c.original.trim(),
        corrected: c.corrected.trim(),
        explanationSq: c.explanationSq,
        category: c.category,
        topicId,
        label: c.label || TOPIC_BY_ID[topicId]?.title || "",
        count: 1,
        firstSeenAt: at,
        lastSeenAt: at,
        dates: [at],
        source,
        correctStreak: 0,
        resolved: false,
      });
    }
  }
  return [...changed.values()];
}

/** Turn mistakes into "fix this sentence" exercises — used in daily sessions and the mistakes page. */
export function mistakeExercises(mistakes: Mistake[]): Exercise[] {
  return mistakes.map((m) => ({
    id: `mistake:${m.id}`,
    type: "fix",
    prompt: m.original,
    promptSq: "Këtë gabim e ke bërë më parë. Korrigjoje.",
    answers: [m.corrected],
    explanation: m.explanationSq,
    topicId: m.topicId,
    level: TOPIC_BY_ID[m.topicId]?.level ?? "A1",
    skill: "grammar",
  }));
}

/** Update a mistake after the learner practised its correction. 3 correct in a row → resolved. */
export function applyMistakePractice(m: Mistake, correct: boolean): Mistake {
  const streak = correct ? m.correctStreak + 1 : 0;
  return { ...m, correctStreak: streak, resolved: streak >= 3 ? true : correct ? m.resolved : false };
}

export function activeMistakes(db: DB): Mistake[] {
  return db.mistakes.filter((m) => !m.resolved).sort((a, b) => b.count - a.count || b.lastSeenAt.localeCompare(a.lastSeenAt));
}

export interface MistakeGroup {
  key: string;
  topicId: string;
  label: string;
  total: number;
  recent: number;
  mistakes: Mistake[];
  recommendationSq: string;
}

export function groupMistakes(db: DB, now = new Date()): MistakeGroup[] {
  const groups = new Map<string, MistakeGroup>();
  for (const m of db.mistakes) {
    const key = m.topicId || `cat:${m.category}`;
    const topic = TOPIC_BY_ID[m.topicId];
    const g = groups.get(key) ?? {
      key,
      topicId: m.topicId,
      label: topic ? `${topic.title} — ${topic.titleSq}` : CATEGORY_LABEL[m.category].sq,
      total: 0,
      recent: 0,
      mistakes: [],
      recommendationSq: topic?.recommendationSq ?? defaultRecommendation(m.category),
    };
    g.total += m.count;
    g.recent += m.dates.filter((d) => daysBetween(d, now) <= 14).length;
    g.mistakes.push(m);
    groups.set(key, g);
  }
  return [...groups.values()].sort((a, b) => b.recent - a.recent || b.total - a.total);
}

function defaultRecommendation(c: MistakeCategory): string {
  switch (c) {
    case "vocabulary":
      return "Shto fjalët në fjalor dhe përsërit me kartat (flashcards).";
    case "unnatural":
      return "Mëso shprehjet e plota si blloqe (chunks), jo fjalë për fjalë nga shqipja.";
    case "spelling":
      return "Kujdes me shkronjat e mëdha te emrat dhe me ä/ö/ü/ß.";
    case "pronunciation":
      return "Dëgjo fjalinë dhe përsërite me zë 3 herë, ngadalë.";
    case "word_order":
      return "Gjej foljen: në fjalinë kryesore në vendin 2, në fjalinë e varur në fund.";
    default:
      return "Ushtro temën gramatikore përkatëse.";
  }
}

export function sourceLabel(s: SessionType | "exercise"): string {
  const map: Record<string, string> = {
    speaking: "Sprechen",
    mentor: "Mentor",
    callcenter: "Callcenter",
    daily: "Tagesprogramm",
    exercise: "Übung",
    grammar: "Grammatik",
    vocabulary: "Wortschatz",
    questions: "Fragen",
    placement: "Einstufung",
    assessment: "Wochentest",
    mistakes: "Fehlertraining",
  };
  return map[s] ?? s;
}
