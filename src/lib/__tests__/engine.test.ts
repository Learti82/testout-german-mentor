import { describe, expect, it } from "vitest";
import { z } from "zod";
import { GRAMMAR_TOPICS, TOPIC_BY_ID, matchTopic, topicsByLevel } from "@/content/grammar";
import { PLACEMENT } from "@/content/assessment";
import { CALL_SCENARIOS } from "@/content/callcenter";
import { ALL_QUESTION_EXERCISES } from "@/content/questions";
import { seedVocabulary } from "@/content/vocabulary";
import { checkAnswer, compareSpoken } from "../answer-check";
import { ConverseResponseSchema, GeneratedExercisesSchema } from "../ai/schemas";
import { applyChanges } from "../db/changes";
import { emptyDb } from "../db/store";
import { LocalStore } from "../db/local-store";
import { TABLE_NAMES } from "../db/tables";
import { converseSystem } from "../ai/prompts";
import { applyTest, computeStatus, emptyProgress, unlockedLevels } from "../grammar-progress";
import { expectedSentence, originalSentence, recordResults, type ExerciseResult } from "../learning";
import { estimateLevel } from "../level";
import { buildMentorContext } from "../memory";
import { recordCorrections } from "../mistakes";
import { initialProfile } from "../profile";
import { buildRecommendation } from "../recommendations";
import { buildDailyGoal, buildStudyPlan } from "../session-plan";
import { derivedStatus, effectiveStatus, newCard, review } from "../srs";
import type { DB, SkillEvidence } from "../types";
import { addDays } from "../utils";

function baseDb(): DB {
  const db = emptyDb();
  const vocab = seedVocabulary();
  return applyChanges(db, { profile: [{ ...initialProfile(), onboardingCompleted: true }], vocabulary: vocab, srs_cards: vocab.map((w) => newCard("vocab", w.id)) });
}

describe("answer checking", () => {
  it("accepts case/punctuation/umlaut variants", () => {
    expect(checkAnswer("wo wohnst du", ["Wo wohnst du?"]).verdict).toBe("correct");
    expect(checkAnswer("Fuer den Kunden.", ["Für den Kunden."]).verdict).toBe("correct");
    expect(checkAnswer("Strasse", ["Straße"]).verdict).toBe("correct");
  });
  it("detects word order errors", () => {
    expect(checkAnswer("Wo du wohnst?", ["Wo wohnst du?"]).verdict).toBe("word_order");
    expect(checkAnswer("Ich lerne Deutsch, weil ich möchte in Deutschland arbeiten", ["Ich lerne Deutsch, weil ich in Deutschland arbeiten möchte."]).verdict).toBe("word_order");
  });
  it("distinguishes small slips from wrong answers", () => {
    expect(checkAnswer("Ich gehe mit meinen Freunde", ["Ich gehe mit meinen Freunden."]).verdict).toBe("almost");
    expect(checkAnswer("Ich habe 25 Jahre", ["Ich bin 25 Jahre alt."]).verdict).toBe("wrong");
  });
  it("flags capitalisation of nouns but still accepts", () => {
    const r = checkAnswer("die rechnung", ["die Rechnung"]);
    expect(r.verdict).toBe("correct");
    expect(r.capitalizationIssue).toBe(true);
  });
  it("compares spoken repetitions word by word", () => {
    const r = compareSpoken("ich gehe mit meinen freunden", "Ich gehe mit meinen Freunden.");
    expect(r.similarity).toBe(1);
    expect(compareSpoken("ich gehe", "Ich gehe mit meinen Freunden.").similarity).toBeLessThan(0.5);
  });
});

describe("spaced repetition", () => {
  it("never marks a word mastered after one correct answer", () => {
    const c = review(newCard("vocab", "x"), 3);
    expect(derivedStatus(c)).toBe("learning");
  });
  it("wrong answers reset the interval and lower ease", () => {
    let c = newCard("vocab", "x");
    c = review(c, 2);
    c = review(c, 2);
    const before = c.ease;
    c = review(c, 0);
    expect(c.repetitions).toBe(0);
    expect(c.ease).toBeLessThan(before);
    expect(c.intervalDays).toBeLessThan(0.05);
  });
  it("reaches mastered only after a long, accurate history", () => {
    let c = newCard("vocab", "x");
    let t = new Date("2026-01-01");
    for (let i = 0; i < 7; i++) {
      c = review(c, 2, t);
      t = new Date(c.dueAt);
    }
    expect(derivedStatus(c)).toBe("mastered");
  });
  it("manual mastered drops back after two failures", () => {
    const w = { ...seedVocabulary()[0], status: "mastered" as const, statusManual: true };
    let c = review(review(newCard("vocab", w.id), 2), 0);
    c = review(c, 0);
    expect(effectiveStatus(w, c)).toBe("learning");
  });
});

describe("grammar mastery and unlocking", () => {
  it("A2+ stays locked until A1 is demonstrated (no placement)", () => {
    const db = baseDb();
    expect(unlockedLevels(db)).toEqual(["A1"]);
    const passed = topicsByLevel("A1").slice(0, 6).map((t) => applyTest(emptyProgress(t.id), 0.9, "test"));
    expect(unlockedLevels(applyChanges(db, { grammar_progress: passed }))).toEqual(["A1", "A2"]);
  });
  it("placement level unlocks levels", () => {
    const db = baseDb();
    db.profile[0].placementLevel = "A2";
    expect(unlockedLevels(db)).toContain("A2");
    expect(unlockedLevels(db)).not.toContain("B1");
  });
  it("mastered requires a later passed review", () => {
    const db = baseDb();
    let p = applyTest(emptyProgress("a1-pronouns"), 0.9, "test", "2026-01-01T10:00:00Z");
    expect(computeStatus(applyChanges(db, { grammar_progress: [p] }), "a1-pronouns")).toBe("demonstrated");
    p = applyTest(p, 0.85, "review", "2026-01-05T10:00:00Z");
    p = applyTest(p, 0.9, "review", "2026-01-12T10:00:00Z");
    expect(computeStatus(applyChanges(db, { grammar_progress: [p] }), "a1-pronouns")).toBe("mastered");
  });
});

describe("mistake tracking", () => {
  it("merges repeated mistakes and counts frequency", () => {
    let db = baseDb();
    const c = { original: "Ich gehe mit meine Freunde.", corrected: "Ich gehe mit meinen Freunden.", explanationSq: "Pas mit përdorim Dativ.", category: "grammar" as const, topicId: "", label: "Dativ nach mit" };
    for (let i = 0; i < 4; i++) db = applyChanges(db, { mistakes: recordCorrections(db, [c], "speaking") });
    expect(db.mistakes).toHaveLength(1);
    expect(db.mistakes[0].count).toBe(4);
    expect(db.mistakes[0].topicId).toBe("a2-dativ");
    // same wrong sentence but a different correction is a different mistake
    db = applyChanges(db, { mistakes: recordCorrections(db, [{ ...c, corrected: "Ich bin müde.", topicId: "a1-sein-haben" }], "exercise") });
    expect(db.mistakes).toHaveLength(2);
    expect(db.mistakes.find((m) => m.corrected === "Ich gehe mit meinen Freunden.")?.count).toBe(4);
  });
  it("records exercise errors as readable sentences", () => {
    const ex = TOPIC_BY_ID["a1-sein-haben"].exercises[0]; // Ich ___ müde.
    expect(originalSentence(ex, "habe")).toBe("Ich habe müde.");
    expect(expectedSentence(ex)).toBe("Ich bin müde.");
    const db = baseDb();
    const res: ExerciseResult[] = [{ exercise: ex, answer: "habe", score: 0, verdict: "wrong", at: new Date().toISOString() }];
    const ch = recordResults(db, res, "exercise");
    expect(ch.mistakes?.[0].original).toBe("Ich habe müde.");
    expect(ch.skill_evidence).toHaveLength(1);
    expect(ch.grammar_progress?.[0].exerciseAttempts).toBe(1);
  });
});

describe("honest CEFR estimation", () => {
  it("is not assessed without evidence and does not inflate from one strong skill", () => {
    const db = baseDb();
    expect(estimateLevel(db).overall).toBeNull();
    const now = new Date();
    const ev: SkillEvidence[] = Array.from({ length: 40 }, (_, i) => ({ id: `g${i}`, skill: "grammar", level: "A1", itemId: `i${i}`, topicId: "", score: 1, at: addDays(now, -1).toISOString(), source: "exercise" }));
    const est = estimateLevel(applyChanges(db, { skill_evidence: ev }), now);
    expect(est.skills.find((s) => s.skill === "grammar")?.level).toBe("A1");
    expect(est.overall).toBeNull(); // only one skill demonstrated
    expect(est.provisional).toBe(true);
  });
});

describe("planning and memory", () => {
  it("builds a daily session that sums to roughly the daily minutes and targets weaknesses", () => {
    const db = baseDb();
    const g = buildDailyGoal(db);
    expect(g.tasks.map((t) => t.id)).toEqual(["vocab", "grammar", "sentences", "conversation", "quiz"]);
    expect(g.minutesTarget).toBeGreaterThanOrEqual(25);
    expect(g.minutesTarget).toBeLessThanOrEqual(50);
    expect(TOPIC_BY_ID[g.tasks[1].topicId!]).toBeDefined();
  });
  it("builds a 7-day plan ending with the weekly assessment", () => {
    const p = buildStudyPlan(baseDb());
    expect(p.days).toHaveLength(7);
    expect(p.days[6].focus).toMatch(/Vlerësimi javor/);
  });
  it("recommendation and mentor context are built from structured records", () => {
    const db = baseDb();
    expect(buildRecommendation(db).practiceToday.length).toBeGreaterThan(0);
    const ctx = buildMentorContext(db);
    expect(ctx.vocabularyLearning.some((w) => w.includes("Rechnung"))).toBe(true);
  });
});

describe("content integrity", () => {
  it("has all requested grammar topics with explanations, examples, mistakes, exercises and tests", () => {
    expect(topicsByLevel("A1").length).toBeGreaterThanOrEqual(9);
    expect(topicsByLevel("A2").length).toBeGreaterThanOrEqual(7);
    expect(topicsByLevel("B1").length).toBeGreaterThanOrEqual(6);
    expect(topicsByLevel("B2").length).toBeGreaterThanOrEqual(5);
    for (const t of GRAMMAR_TOPICS) {
      expect(t.explanationSq.length, t.id).toBeGreaterThan(0);
      expect(t.examples.length, t.id).toBeGreaterThanOrEqual(3);
      expect(t.commonMistakes.length, t.id).toBeGreaterThanOrEqual(3);
      expect(t.exercises.length, t.id).toBeGreaterThanOrEqual(3);
      expect(t.test.length, t.id).toBeGreaterThanOrEqual(2);
    }
  });
  it("every exercise is answerable", () => {
    const all = [...GRAMMAR_TOPICS.flatMap((t) => [...t.exercises, ...t.test]), ...ALL_QUESTION_EXERCISES, ...PLACEMENT.sentences, ...PLACEMENT.questions, ...PLACEMENT.grammar];
    const ids = new Set<string>();
    for (const e of all) {
      if (e.type === "mc") {
        expect(e.options?.length, e.id).toBeGreaterThanOrEqual(2);
        expect(e.correctIndex! < e.options!.length, e.id).toBe(true);
      } else expect(e.answers?.length, e.id).toBeGreaterThan(0);
      if (e.type === "fill" || e.type === "mc") if (e.prompt.includes("___")) expect(e.prompt.split("___").length, e.id).toBe(2);
      if (!e.id.startsWith("placement")) {
        expect(ids.has(e.id), `duplicate ${e.id}`).toBe(false);
        ids.add(e.id);
      }
      // model answer passes its own checker
      if (e.type !== "mc" && e.type !== "free") expect(checkAnswer(e.answers![0], e.answers!).verdict, e.id).toBe("correct");
    }
  });
  it("call-center scenarios are complete", () => {
    expect(CALL_SCENARIOS.length).toBeGreaterThanOrEqual(8);
    for (const s of CALL_SCENARIOS) expect(s.script.length, s.id).toBeGreaterThanOrEqual(3);
  });
  it("maps labels to topics", () => {
    expect(matchTopic("Dativ nach mit")).toBe("a2-dativ");
    expect(matchTopic("Reflexivpronomen falsch")).toBe("a2-reflexive");
  });
});

describe("browser storage", () => {
  it("saves, updates and deletes rows in localStorage", async () => {
    const mem = new Map<string, string>();
    (globalThis as unknown as { localStorage: Storage }).localStorage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
      clear: () => mem.clear(),
      key: () => null,
      length: 0,
    } as Storage;
    const st = new LocalStore();
    const p = initialProfile();
    await st.upsert("profile", [p]);
    await st.upsert("profile", [{ ...p, displayName: "Arben" }]);
    const all = await st.loadAll();
    expect(all.profile).toHaveLength(1);
    expect(all.profile?.[0].displayName).toBe("Arben");
    await st.remove("profile", [p.id]);
    expect((await st.loadAll()).profile).toHaveLength(0);
    expect(Object.keys(all)).toEqual(TABLE_NAMES);
  });
});

describe("prompt size for small local models", () => {
  it("conversation system prompt stays well inside a 4k-token context", () => {
    const db = baseDb();
    const sys = converseSystem("callcenter", buildMentorContext(db), { title: "Test", context: "x".repeat(400), level: "A2", goals: ["a", "b"] });
    // ~4 chars per token
    expect(sys.length / 4).toBeLessThan(1400);
  });
});

describe("AI schemas", () => {
  it("convert to JSON schema and validate sample output", () => {
    expect(() => z.toJSONSchema(ConverseResponseSchema)).not.toThrow();
    expect(() => z.toJSONSchema(GeneratedExercisesSchema)).not.toThrow();
    const sample = {
      analysis: { isCorrect: false, feedbackSq: "Pothuajse!", corrections: [{ original: "mit meine Freunde", corrected: "mit meinen Freunden", explanationSq: "Pas mit → Dativ.", category: "grammar", topicId: "a2-dativ", label: "Dativ" }] },
      repeatSentence: "Ich gehe mit meinen Freunden.",
      reply: { german: "Was macht ihr zusammen?", albanian: "Çfarë bëni bashkë?" },
      vocabulary: [],
      memoryNotes: [],
      turnScore: 0.6,
      endConversation: false,
    };
    expect(ConverseResponseSchema.parse(sample).reply.german).toBe("Was macht ihr zusammen?");
  });
});
