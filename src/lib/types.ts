// Core domain types. Every persisted row type maps 1:1 to a database table
// (see src/lib/db/tables.ts and supabase/migrations).

export type CEFR = "A1" | "A2" | "B1" | "B2";
export const CEFR_LEVELS: CEFR[] = ["A1", "A2", "B1", "B2"];

export type Skill = "grammar" | "vocabulary" | "reading" | "listening" | "speaking" | "writing";
export const SKILLS: Skill[] = ["grammar", "vocabulary", "reading", "listening", "speaking", "writing"];

export type TranslationLevel = "full" | "partial" | "minimal";

// ---------- Exercises (content + AI generated) ----------

export type ExerciseType =
  | "mc" // multiple choice
  | "fill" // fill in the blank (___)
  | "translate" // Albanian -> German (typed)
  | "order" // put words in order
  | "transform" // transform a sentence (e.g. statement -> question)
  | "fix" // correct a wrong sentence
  | "free"; // open answer; AI evaluated (self-check offline)

export interface Exercise {
  id: string;
  type: ExerciseType;
  /** Instruction / question shown to the learner. */
  prompt: string;
  /** Albanian helper text (translation of the prompt or a hint). */
  promptSq?: string;
  /** For mc. */
  options?: string[];
  /** For mc: index of correct option. */
  correctIndex?: number;
  /** Accepted answers for typed exercises. First one is the model answer. */
  answers?: string[];
  /** For order exercises: the scrambled words. Generated from answers[0] if missing. */
  words?: string[];
  /** Explanation in Albanian, shown after answering. */
  explanation?: string;
  topicId: string;
  level: CEFR;
  skill: Skill;
}

// ---------- Persisted rows ----------

export interface Profile {
  id: string; // always "me"
  displayName: string;
  nativeLanguage: string;
  currentLevelClaimed: string;
  targetLevel: CEFR;
  longTermGoal: string;
  preferences: string[];
  knownWeaknesses: string[];
  dailyMinutes: number;
  translationMode: "auto" | TranslationLevel;
  ttsRate: number;
  theme: "system" | "light" | "dark";
  aiModelOverride: string;
  onboardingCompleted: boolean;
  placementCompletedAt: string | null;
  placementLevel: CEFR | null;
  createdAt: string;
  updatedAt: string;
}

export type SessionType =
  | "daily"
  | "grammar"
  | "vocabulary"
  | "questions"
  | "speaking"
  | "callcenter"
  | "mentor"
  | "mistakes"
  | "placement"
  | "assessment";

export interface LearningSession {
  id: string;
  type: SessionType;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  itemsTotal: number;
  itemsCorrect: number;
  /** 0..1 or null when not scored */
  score: number | null;
  topicIds: string[];
  summary: string;
  details: Record<string, unknown>;
}

export type VocabStatus = "new" | "learning" | "difficult" | "known" | "mastered";
export const VOCAB_STATUSES: VocabStatus[] = ["new", "learning", "difficult", "known", "mastered"];

export interface VocabWord {
  id: string;
  german: string; // without article, e.g. "Rechnung"
  albanian: string;
  article: "der" | "die" | "das" | null;
  plural: string | null; // e.g. "die Rechnungen"
  partOfSpeech: "noun" | "verb" | "adjective" | "phrase" | "other";
  example: string;
  exampleSq: string;
  level: CEFR;
  difficulty: 1 | 2 | 3;
  tags: string[];
  status: VocabStatus;
  /** true when the learner set the status manually (algorithm won't auto-promote above it until reviews agree). */
  statusManual: boolean;
  source: "seed" | "conversation" | "manual" | "callcenter";
  createdAt: string;
}

export interface SrsCard {
  id: string; // `${itemType}:${itemId}`
  itemType: "vocab" | "phrase";
  itemId: string;
  ease: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  dueAt: string;
  lastReviewedAt: string | null;
  totalReviews: number;
  totalCorrect: number;
  /** last N results, 1 = correct, 0 = wrong (newest last) */
  history: number[];
}

export type GrammarStatus = "locked" | "available" | "studied" | "practiced" | "demonstrated" | "mastered";

export interface GrammarProgress {
  id: string; // topic id
  topicId: string;
  status: GrammarStatus;
  lessonViewedAt: string | null;
  exerciseAttempts: number;
  exerciseCorrect: number;
  testAttempts: number;
  testBestScore: number;
  /** Test/review scores over time (0..1) with timestamps. */
  scoreHistory: { at: string; score: number; kind: "test" | "review" | "practice" }[];
  lastPracticedAt: string | null;
  nextReviewAt: string | null;
}

export type MistakeCategory = "grammar" | "word_order" | "vocabulary" | "unnatural" | "spelling" | "pronunciation";
export const MISTAKE_CATEGORIES: MistakeCategory[] = [
  "grammar",
  "word_order",
  "vocabulary",
  "unnatural",
  "spelling",
  "pronunciation",
];

export interface Mistake {
  id: string;
  original: string;
  corrected: string;
  explanationSq: string;
  category: MistakeCategory;
  /** Grammar topic id from the curriculum, or "" */
  topicId: string;
  /** Human label, e.g. "Dativ nach mit" */
  label: string;
  count: number;
  firstSeenAt: string;
  lastSeenAt: string;
  dates: string[];
  source: SessionType | "exercise";
  /** consecutive correct attempts on practice items generated from this mistake */
  correctStreak: number;
  resolved: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  /** Albanian translation for assistant messages */
  translation?: string;
  at: string;
  inputMethod?: "voice" | "text";
  corrections?: Correction[];
  feedbackSq?: string;
  isCorrect?: boolean;
}

export interface Correction {
  original: string;
  corrected: string;
  explanationSq: string;
  category: MistakeCategory;
  topicId: string;
  label: string;
}

export interface Conversation {
  id: string;
  mode: "mentor" | "speaking" | "callcenter" | "placement" | "daily" | "assessment";
  scenarioId: string;
  title: string;
  startedAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  summary: string;
  evaluation: Record<string, unknown> | null;
}

export interface PlanTask {
  id: string;
  block: "vocabulary" | "grammar" | "sentences" | "conversation" | "quiz" | "questions" | "callcenter" | "review";
  title: string;
  titleSq: string;
  minutes: number;
  topicId?: string;
  scenarioId?: string;
  reason: string;
}

export interface Recommendation {
  practiceToday: string[];
  reviewTopics: { topicId: string; reason: string }[];
  repeatedMistakes: { label: string; count: number; topicId: string }[];
  improved: string[];
  nextToLearn: { topicId: string; reason: string } | null;
  dailyGoal: string;
  mentorNote: string;
}

export interface DailyGoal {
  id: string; // YYYY-MM-DD
  date: string;
  tasks: PlanTask[];
  completedTaskIds: string[];
  minutesTarget: number;
  recommendation: Recommendation;
  mentorMessage: string;
  generatedBy: "rules" | "ai";
  createdAt: string;
}

export interface SectionScores {
  vocabulary: number | null;
  grammar: number | null;
  sentences: number | null;
  questions: number | null;
  reading: number | null;
  listening: number | null;
  speaking: number | null;
}

export interface WeeklyReport {
  learned: string[];
  strengths: string[];
  struggles: string[];
  frequentMistakes: { label: string; count: number }[];
  comparison: string;
  nextWeekPlan: string[];
  narrative: string;
}

export interface WeeklyAssessment {
  id: string;
  weekStart: string;
  takenAt: string;
  sectionScores: SectionScores;
  overall: number;
  estimatedLevel: string;
  report: WeeklyReport;
  details: Record<string, unknown>;
}

export interface MentorMemory {
  id: string;
  kind: "observation" | "goal" | "preference" | "milestone";
  content: string;
  topicId: string;
  importance: 1 | 2 | 3;
  createdAt: string;
}

export interface SkillEvidence {
  id: string;
  skill: Skill;
  level: CEFR;
  itemId: string;
  topicId: string;
  /** 0..1 */
  score: number;
  at: string;
  source: SessionType | "exercise";
}

export interface StudyPlan {
  id: string;
  createdAt: string;
  startsOn: string;
  days: { day: number; date: string; focus: string; focusSq: string; topicIds: string[]; tasks: string[] }[];
  rationale: string;
  generatedBy: "rules" | "ai";
}

export interface DB {
  profile: Profile[];
  learning_sessions: LearningSession[];
  vocabulary: VocabWord[];
  srs_cards: SrsCard[];
  grammar_progress: GrammarProgress[];
  mistakes: Mistake[];
  conversations: Conversation[];
  daily_goals: DailyGoal[];
  weekly_assessments: WeeklyAssessment[];
  mentor_memory: MentorMemory[];
  skill_evidence: SkillEvidence[];
  study_plans: StudyPlan[];
}

export type TableName = keyof DB;
export type Row<T extends TableName> = DB[T][number];
