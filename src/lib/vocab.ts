import { displayWord } from "@/content/vocabulary";
import type { Changes } from "./db/changes";
import type { ExerciseResult } from "./learning";
import { type Grade, newCard, review } from "./srs";
import type { DB, Exercise, SkillEvidence, VocabWord } from "./types";
import { nowIso, uid } from "./utils";

export function vocabTranslateExercise(w: VocabWord): Exercise {
  const full = displayWord(w);
  return {
    id: `vocab:${w.id}`,
    type: "translate",
    prompt: w.albanian,
    promptSq: w.article ? "Shkruaje fjalën gjermane ME nyje (der/die/das)" : "Shkruaje në gjermanisht",
    answers: w.article ? [full] : [w.german],
    explanation: `${full}${w.plural ? ` · Plural: ${w.plural}` : ""} — ${w.example}`,
    topicId: "",
    level: w.level,
    skill: "vocabulary",
  };
}

export function vocabFillExercise(w: VocabWord): Exercise | null {
  const re = new RegExp(`\\b${w.german.split(" ")[0]}\\w*`, "i");
  if (!re.test(w.example)) return null;
  return {
    id: `vocabfill:${w.id}`,
    type: "fill",
    prompt: w.example.replace(re, "___"),
    promptSq: `${w.exampleSq} (fjala: ${w.albanian})`,
    answers: [w.example.match(re)![0]],
    explanation: `${displayWord(w)} = ${w.albanian}`,
    topicId: "",
    level: w.level,
    skill: "vocabulary",
  };
}

export function vocabMcExercise(w: VocabWord, pool: VocabWord[]): Exercise {
  const distractors = pool.filter((x) => x.id !== w.id).sort(() => Math.random() - 0.5).slice(0, 3).map((x) => x.albanian);
  const options = [...distractors, w.albanian].sort(() => Math.random() - 0.5);
  return {
    id: `vocabmc:${w.id}`,
    type: "mc",
    prompt: displayWord(w),
    promptSq: "Çfarë do të thotë?",
    options,
    correctIndex: options.indexOf(w.albanian),
    explanation: w.example,
    topicId: "",
    level: w.level,
    skill: "vocabulary",
  };
}

export function wordIdFromExercise(id: string): string | null {
  const m = id.match(/^vocab(?:fill|mc)?:(.+)$/);
  return m ? m[1] : null;
}

/** Vocabulary exercise results also move the spaced-repetition schedule. */
export function srsFromResults(db: DB, results: ExerciseResult[]): Changes {
  const cards = new Map(db.srs_cards.map((c) => [c.itemId, c]));
  const changed = new Map<string, ReturnType<typeof review>>();
  for (const r of results) {
    const wid = wordIdFromExercise(r.exercise.id);
    if (!wid) continue;
    const card = changed.get(wid) ?? cards.get(wid) ?? newCard("vocab", wid);
    const grade: Grade = r.score >= 1 ? 2 : r.score > 0 ? 1 : 0;
    changed.set(wid, review(card, grade));
  }
  return { srs_cards: [...changed.values()] };
}

export function flashcardEvidence(w: VocabWord, grade: Grade): SkillEvidence {
  return { id: uid(), skill: "vocabulary", level: w.level, itemId: `vocab:${w.id}`, topicId: "", score: grade >= 2 ? 1 : grade === 1 ? 0.5 : 0, at: nowIso(), source: "vocabulary" };
}
