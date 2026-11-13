import { z } from "zod";

export const MentorContextSchema = z.object({
  level: z.string(),
  workingLevel: z.string(),
  translation: z.string(),
  goal: z.string(),
  weakTopics: z.array(z.string()),
  topMistakes: z.array(z.string()),
  vocabularyLearning: z.array(z.string()),
  vocabularyKnown: z.array(z.string()),
  topicsStatus: z.array(z.string()),
  notes: z.array(z.string()),
  lastSessions: z.array(z.string()),
});

const Msg = z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) });
const Scenario = z
  .object({
    title: z.string(),
    context: z.string(),
    level: z.string(),
    goals: z.array(z.object({ id: z.string(), de: z.string() })).optional(),
  })
  .nullable();

export const ConverseRequest = z.object({
  mode: z.enum(["mentor", "speaking", "callcenter", "placement", "daily"]),
  context: MentorContextSchema,
  scenario: Scenario,
  history: z.array(Msg).max(60),
  inputMethod: z.enum(["voice", "text"]).optional(),
  model: z.string().optional(),
});

export const EvaluateConversationRequest = z.object({
  mode: z.enum(["speaking", "callcenter"]),
  context: MentorContextSchema,
  scenario: z.object({ title: z.string(), goals: z.array(z.object({ id: z.string(), de: z.string() })).optional() }),
  history: z.array(Msg).max(80),
  model: z.string().optional(),
});

export const EvaluateAnswerRequest = z.object({
  context: MentorContextSchema,
  prompt: z.string().max(1000),
  promptSq: z.string().max(500).optional(),
  modelAnswer: z.string().max(1000).optional(),
  answer: z.string().max(2000),
  level: z.string(),
  topicId: z.string(),
  model: z.string().optional(),
});

export const GenerateRequest = z.object({
  context: MentorContextSchema,
  topicId: z.string(),
  topicTitle: z.string(),
  level: z.string(),
  count: z.number().int().min(1).max(12),
  types: z.array(z.string()).max(6),
  focusMistakes: z.array(z.string()).max(10),
  avoid: z.array(z.string()).max(40),
  model: z.string().optional(),
});

export const BriefingRequest = z.object({ context: MentorContextSchema, analysis: z.unknown(), model: z.string().optional() });
export const WeeklyRequest = z.object({ context: MentorContextSchema, results: z.unknown(), model: z.string().optional() });
export const PlanRequest = z.object({ context: MentorContextSchema, results: z.unknown(), model: z.string().optional() });
