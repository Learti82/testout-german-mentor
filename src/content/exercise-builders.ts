import type { CEFR, Exercise, Skill } from "@/lib/types";

/** Compact builders for curriculum exercises. */
export function builders(topicId: string, level: CEFR, skill: Skill = "grammar") {
  const base = (id: string) => ({ id: `${topicId}.${id}`, topicId, level, skill });
  return {
    mc: (id: string, prompt: string, options: string[], correctIndex: number, explanation: string, promptSq?: string): Exercise => ({
      ...base(id), type: "mc", prompt, options, correctIndex, explanation, promptSq,
    }),
    fill: (id: string, prompt: string, answers: string[], explanation: string, promptSq?: string): Exercise => ({
      ...base(id), type: "fill", prompt, answers, explanation, promptSq,
    }),
    tr: (id: string, sq: string, answers: string[], explanation: string): Exercise => ({
      ...base(id), type: "translate", prompt: sq, answers, explanation, promptSq: "Përkthe në gjermanisht",
    }),
    ord: (id: string, answer: string, explanation: string, promptSq?: string, alt: string[] = []): Exercise => ({
      ...base(id), type: "order", prompt: "Bilde den Satz.", answers: [answer, ...alt], explanation,
      promptSq: promptSq ?? "Rendit fjalët për të formuar fjalinë.",
    }),
    tf: (id: string, prompt: string, answers: string[], explanation: string, promptSq?: string): Exercise => ({
      ...base(id), type: "transform", prompt, answers, explanation, promptSq,
    }),
    fix: (id: string, wrong: string, answers: string[], explanation: string): Exercise => ({
      ...base(id), type: "fix", prompt: wrong, answers, explanation, promptSq: "Korrigjo fjalinë.",
    }),
    free: (id: string, prompt: string, model: string, explanation: string, promptSq?: string): Exercise => ({
      ...base(id), type: "free", prompt, answers: [model], explanation, promptSq,
    }),
  };
}

/** Split a model answer into shuffled words for order exercises (punctuation stays attached to the last word). */
export function wordsFor(ex: Exercise): string[] {
  if (ex.words?.length) return ex.words;
  const answer = ex.answers?.[0] ?? "";
  return answer.replace(/[.?!]$/, "").split(/\s+/).filter(Boolean);
}
