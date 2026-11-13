import type { CEFR, Exercise } from "@/lib/types";
import { A1_TOPICS } from "./a1";
import { A2_TOPICS } from "./a2";
import { B1_TOPICS } from "./b1";
import { B2_TOPICS } from "./b2";
import type { GrammarTopic } from "./types";

export type { GrammarTopic };

export const GRAMMAR_TOPICS: GrammarTopic[] = [...A1_TOPICS, ...A2_TOPICS, ...B1_TOPICS, ...B2_TOPICS];

export const TOPIC_BY_ID: Record<string, GrammarTopic> = Object.fromEntries(GRAMMAR_TOPICS.map((t) => [t.id, t]));

export function topicsByLevel(level: CEFR): GrammarTopic[] {
  return GRAMMAR_TOPICS.filter((t) => t.level === level);
}

export function topicTitle(id: string): string {
  if (id === "questions") return "Fragen bilden";
  if (id === "callcenter") return "Callcenter-Deutsch";
  const t = TOPIC_BY_ID[id];
  return t ? `${t.title}` : id || "Allgemein";
}

export function topicTitleSq(id: string): string {
  if (id === "questions") return "Formimi i pyetjeve";
  if (id === "callcenter") return "Gjermanishtja për call center";
  return TOPIC_BY_ID[id]?.titleSq ?? "";
}

/** All exercises (practice + test) indexed by id. */
export const ALL_GRAMMAR_EXERCISES: Exercise[] = GRAMMAR_TOPICS.flatMap((t) => [...t.exercises, ...t.test]);

/** Map a free-text label/category from an AI correction to a curriculum topic (token-prefix match, no substrings). */
export function matchTopic(text: string): string {
  const tokens = text.toLowerCase().split(/[^a-zäöüß/-]+/).filter(Boolean);
  let best = { id: "", score: 0 };
  for (const t of GRAMMAR_TOPICS) {
    let score = 0;
    for (const raw of t.keywords) {
      const k = raw.toLowerCase();
      const hit = k.includes(" ")
        ? text.toLowerCase().includes(k)
        : tokens.some((tok) => (k.length >= 4 ? tok.startsWith(k) : tok === k));
      if (hit) score += k.length;
    }
    if (score > best.score) best = { id: t.id, score };
  }
  return best.id;
}
