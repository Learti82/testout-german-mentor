import { z } from "zod";

// All fields are required (use "" / [] for "none") so the schemas work with strict structured outputs.

export const CategoryEnum = z.enum(["grammar", "word_order", "vocabulary", "unnatural", "spelling", "pronunciation"]);

export const CorrectionSchema = z.object({
  original: z.string().describe("The learner's exact wrong sentence or phrase"),
  corrected: z.string().describe("The corrected German"),
  explanationSq: z.string().describe("Short explanation in simple Albanian of WHY it was wrong"),
  category: CategoryEnum,
  topicId: z.string().describe("Curriculum topic id like a2-dativ, or empty string"),
  label: z.string().describe("Short German label, e.g. 'Dativ nach mit'"),
});

export const VocabSuggestionSchema = z.object({
  german: z.string().describe("Word without article, nouns capitalised"),
  albanian: z.string(),
  article: z.enum(["der", "die", "das", ""]),
  plural: z.string().describe("e.g. 'die Rechnungen' or empty"),
  example: z.string(),
  exampleSq: z.string(),
});

export const ConverseResponseSchema = z.object({
  analysis: z.object({
    isCorrect: z.boolean().describe("true only if the learner's last message had no errors"),
    feedbackSq: z.string().describe("1–2 sentences in Albanian: encouragement + what to fix. Empty if no learner message."),
    corrections: z.array(CorrectionSchema),
  }),
  repeatSentence: z.string().describe("The corrected full sentence the learner should repeat aloud, or empty string if correct"),
  reply: z.object({
    german: z.string().describe("Your next message in German at the learner's level. Ask ONE question."),
    albanian: z.string().describe("Albanian translation of reply.german"),
  }),
  vocabulary: z.array(VocabSuggestionSchema).describe("0–3 useful new words from this turn worth saving"),
  memoryNotes: z.array(z.string()).describe("0–2 short durable observations about the learner (English), e.g. 'Confuses als/wenn'"),
  turnScore: z.number().describe("0..1 quality of the learner's last message for their level"),
  endConversation: z.boolean(),
});
export type ConverseResponse = z.infer<typeof ConverseResponseSchema>;

export const EvaluationSchema = z.object({
  grammar: z.number().describe("0-10"),
  vocabulary: z.number().describe("0-10"),
  fluency: z.number().describe("0-10"),
  professionalism: z.number().describe("0-10 (politeness, Sie-form, structure); for non-call-center use 0-10 appropriateness"),
  comprehension: z.number().describe("0-10 understanding of the other speaker"),
  estimatedLevel: z.enum(["A1", "A2", "B1", "B2"]),
  summarySq: z.string(),
  strengthsSq: z.array(z.string()),
  improveSq: z.array(z.string()),
  goalsAchieved: z.array(z.string()).describe("ids of scenario goals the learner achieved"),
});
export type Evaluation = z.infer<typeof EvaluationSchema>;

export const ExerciseEvalSchema = z.object({
  verdict: z.enum(["correct", "almost", "wrong"]),
  score: z.number().describe("0..1"),
  corrected: z.string().describe("Best corrected version of the learner's answer"),
  explanationSq: z.string(),
  corrections: z.array(CorrectionSchema),
});
export type ExerciseEval = z.infer<typeof ExerciseEvalSchema>;

export const GeneratedExercisesSchema = z.object({
  exercises: z.array(
    z.object({
      type: z.enum(["mc", "fill", "translate", "order", "transform", "fix"]),
      prompt: z.string().describe("German prompt. For fill use ___ for the gap. For translate: the ALBANIAN sentence. For fix: the wrong sentence."),
      promptSq: z.string().describe("Short Albanian instruction"),
      options: z.array(z.string()).describe("mc only; otherwise []"),
      correctIndex: z.number().describe("mc only; otherwise 0"),
      answers: z.array(z.string()).describe("Accepted answers (first = model answer); [] for mc"),
      explanation: z.string().describe("Albanian explanation"),
    }),
  ),
});
export type GeneratedExercises = z.infer<typeof GeneratedExercisesSchema>;

export const BriefingSchema = z.object({
  messageSq: z.string().describe("3–5 sentences in Albanian, warm but honest"),
  focusToday: z.array(z.string()),
});
export type Briefing = z.infer<typeof BriefingSchema>;

export const WeeklyNarrativeSchema = z.object({
  narrativeSq: z.string(),
  strengths: z.array(z.string()),
  struggles: z.array(z.string()),
  nextWeekPlan: z.array(z.string()),
});
export type WeeklyNarrative = z.infer<typeof WeeklyNarrativeSchema>;

export const PlanSchema = z.object({
  rationaleSq: z.string(),
  days: z.array(z.object({ day: z.number(), focusSq: z.string(), topicIds: z.array(z.string()), tasks: z.array(z.string()) })),
});
export type PlanResponse = z.infer<typeof PlanSchema>;
