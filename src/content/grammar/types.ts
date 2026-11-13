import type { CEFR, Exercise } from "@/lib/types";

export interface GrammarTopic {
  id: string;
  level: CEFR;
  title: string;
  titleSq: string;
  summarySq: string;
  /** Simple explanation in Albanian (paragraphs) */
  explanationSq: string[];
  /** The German rule, short and practical */
  rule: string[];
  table?: { headers: string[]; rows: string[][] };
  examples: { de: string; sq: string }[];
  commonMistakes: { wrong: string; right: string; whySq: string }[];
  exercises: Exercise[];
  test: Exercise[];
  /** Practical advice shown on the mistakes page (Albanian) */
  recommendationSq: string;
  /** Keywords that help map AI corrections to this topic */
  keywords: string[];
}
