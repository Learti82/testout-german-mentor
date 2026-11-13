"use client";

// The mentor's AI calls. Everything runs locally (browser model or Ollama) — no API key, no server.
import type { MentorContext } from "../memory";
import { generateStructured } from "./engine";
import { briefingSystem, converseSystem, evaluationSystem, exerciseEvalSystem, generateSystem, planSystem, weeklySystem } from "./prompts";
import { BriefingSchema, ConverseResponseSchema, EvaluationSchema, ExerciseEvalSchema, GeneratedExercisesSchema, PlanSchema, WeeklyNarrativeSchema } from "./schemas";

export type { AiStatus } from "./engine";
export { AiError as AiClientError } from "./engine";

type Msg = { role: "user" | "assistant"; content: string };
type Scenario = { title: string; context: string; level: string; goals?: { id: string; de: string }[] } | null;

const clamp = (s: string, n = 1500) => (s.length > n ? s.slice(0, n) + " …" : s);

export const ai = {
  converse: (b: { mode: string; context: MentorContext; scenario: Scenario; history: Msg[]; inputMethod?: "voice" | "text" }) => {
    const history = b.history.slice(-8).map((m) => ({ ...m, content: clamp(m.content, 600) }));
    const last = history.at(-1);
    if (last?.role === "user" && b.inputMethod === "voice") last.content += "\n[spoken via microphone]";
    return generateStructured({
      system: converseSystem(b.mode as Parameters<typeof converseSystem>[0], b.context, b.scenario ? { ...b.scenario, goals: b.scenario.goals?.map((g) => `${g.id}: ${g.de}`) } : null),
      messages: history,
      schema: ConverseResponseSchema,
      maxTokens: 700,
    });
  },
  evaluateConversation: (b: { mode: "speaking" | "callcenter"; context: MentorContext; scenario: { title: string; goals?: { id: string; de: string }[] }; history: Msg[] }) => {
    const transcript = b.history
      .slice(-20)
      .map((m) => `${m.role === "user" ? (b.mode === "callcenter" ? "EMPLOYEE" : "LEARNER") : b.mode === "callcenter" ? "CUSTOMER" : "PARTNER"}: ${clamp(m.content, 300)}`)
      .join("\n");
    return generateStructured({ system: evaluationSystem(b.mode, b.context, b.scenario), messages: [{ role: "user", content: `Transcript:\n${transcript}` }], schema: EvaluationSchema, maxTokens: 600 });
  },
  evaluateAnswer: (b: { context: MentorContext; prompt: string; promptSq?: string; modelAnswer?: string; answer: string; level: string; topicId: string }) =>
    generateStructured({
      system: exerciseEvalSystem(b.context),
      messages: [
        {
          role: "user",
          content: `Exercise (${b.level}, ${b.topicId}): ${b.prompt}${b.promptSq ? `\nInstruction (sq): ${b.promptSq}` : ""}${b.modelAnswer ? `\nModel answer: ${b.modelAnswer}` : ""}\nLearner answer: ${clamp(b.answer, 500)}`,
        },
      ],
      schema: ExerciseEvalSchema,
      maxTokens: 400,
      temperature: 0.1,
    }),
  generate: (b: { context: MentorContext; topicId: string; topicTitle: string; level: string; count: number; types: string[]; focusMistakes: string[]; avoid: string[] }) =>
    generateStructured({
      system: generateSystem(b.context),
      messages: [
        {
          role: "user",
          content: `Create ${b.count} exercises. Topic: ${b.topicTitle} [${b.topicId}], level ${b.level}. Types: ${b.types.join(", ")}.
Target these mistakes: ${b.focusMistakes.join(" | ") || "none"}
Do not copy: ${b.avoid.slice(0, 8).join(" | ")}`,
        },
      ],
      schema: GeneratedExercisesSchema,
      maxTokens: 250 * b.count + 100,
      temperature: 0.6,
    }),
  briefing: (b: { context: MentorContext; analysis: unknown }) =>
    generateStructured({ system: briefingSystem(b.context), messages: [{ role: "user", content: clamp(JSON.stringify(b.analysis), 2000) }], schema: BriefingSchema, maxTokens: 400 }),
  weekly: (b: { context: MentorContext; results: unknown }) =>
    generateStructured({ system: weeklySystem(b.context), messages: [{ role: "user", content: clamp(JSON.stringify(b.results), 3000) }], schema: WeeklyNarrativeSchema, maxTokens: 800 }),
  plan: (b: { context: MentorContext; results: unknown }) =>
    generateStructured({ system: planSystem(b.context), messages: [{ role: "user", content: clamp(JSON.stringify(b.results), 2000) }], schema: PlanSchema, maxTokens: 900 }),
};
