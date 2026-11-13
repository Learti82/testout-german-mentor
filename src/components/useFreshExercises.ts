"use client";

import { useEffect, useRef, useState } from "react";
import { TOPIC_BY_ID } from "@/content/grammar";
import { useData } from "@/components/providers/DataProvider";
import { ai } from "@/lib/ai/client";
import { pickExercises } from "@/lib/exercise-select";
import { buildMentorContext } from "@/lib/memory";
import type { CEFR, Exercise } from "@/lib/types";
import { uid } from "@/lib/utils";

/**
 * Exercises for a topic: chosen from the curriculum bank (least-recently-seen first) and, when the AI
 * is available, mixed with freshly generated ones targeting the learner's own mistakes.
 */
export function useFreshExercises(opts: { key: string; topicId: string; pool: Exercise[]; count: number; aiShare?: number; types?: string[]; enabled?: boolean }) {
  const { db, ai: aiStatus } = useData();
  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [aiCount, setAiCount] = useState(0);
  const started = useRef<string | null>(null);

  useEffect(() => {
    if (opts.enabled === false || aiStatus === null || started.current === opts.key) return;
    started.current = opts.key;
    const share = aiStatus.available ? (opts.aiShare ?? 0.5) : 0;
    const nAi = Math.round(opts.count * share);
    const bank = pickExercises(db, opts.pool, opts.count - nAi, { seed: opts.key });
    if (!nAi) {
      setExercises(bank);
      return;
    }
    const topic = TOPIC_BY_ID[opts.topicId];
    const level = (topic?.level ?? "A1") as CEFR;
    const mistakes = db.mistakes.filter((m) => m.topicId === opts.topicId && !m.resolved).slice(0, 6).map((m) => `${m.original} → ${m.corrected}`);
    const timeout = new Promise<null>((r) => setTimeout(() => r(null), 25000));
    Promise.race([
      ai.generate({
        context: buildMentorContext(db),
        topicId: opts.topicId,
        topicTitle: topic ? `${topic.title} (${topic.titleSq})` : opts.topicId,
        level,
        count: nAi,
        types: opts.types ?? ["fill", "translate", "order", "transform", "fix", "mc"],
        focusMistakes: mistakes,
        avoid: opts.pool.slice(0, 30).map((e) => e.prompt),
      }),
      timeout,
    ])
      .then((res) => {
        const gen: Exercise[] = (res?.exercises ?? [])
          .filter((e) => (e.type === "mc" ? e.options.length >= 2 : e.answers.length >= 1))
          .map((e) => ({
            id: `ai:${opts.topicId}:${uid()}`,
            type: e.type,
            prompt: e.prompt,
            promptSq: e.promptSq,
            options: e.type === "mc" ? e.options : undefined,
            correctIndex: e.type === "mc" ? Math.max(0, Math.min(e.correctIndex, e.options.length - 1)) : undefined,
            answers: e.type === "mc" ? undefined : e.answers,
            explanation: e.explanation,
            topicId: opts.topicId,
            level,
            skill: "grammar",
          }));
        setAiCount(gen.length);
        const extra = gen.length < nAi ? pickExercises(db, opts.pool, nAi - gen.length, { exclude: new Set(bank.map((b) => b.id)), seed: opts.key + "x" }) : [];
        // interleave bank and generated items
        const mixed: Exercise[] = [];
        const a = [...bank, ...extra];
        const b = [...gen];
        while (a.length || b.length) {
          if (a.length) mixed.push(a.shift()!);
          if (b.length) mixed.push(b.shift()!);
        }
        setExercises(mixed);
      })
      .catch(() => setExercises(pickExercises(db, opts.pool, opts.count, { seed: opts.key })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.key, aiStatus, opts.enabled]);

  return { exercises, aiCount };
}
