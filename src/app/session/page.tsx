"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { ALL_GRAMMAR_EXERCISES, TOPIC_BY_ID } from "@/content/grammar";
import { QUESTION_STAGES } from "@/content/questions";
import { SCENARIO_BY_ID } from "@/content/scenarios";
import { ConversationPanel } from "@/components/ConversationPanel";
import { ExerciseRunner } from "@/components/ExerciseRunner";
import { FlashcardReview } from "@/components/FlashcardReview";
import { useCompleteTask, useDailyGoal } from "@/components/hooks";
import { Icon } from "@/components/icons";
import { useData } from "@/components/providers/DataProvider";
import { useFreshExercises } from "@/components/useFreshExercises";
import { Badge, Button, Card, LinkButton, PageHeader, Spinner, Sq } from "@/components/ui";
import { pickExercises } from "@/lib/exercise-select";
import { markLessonViewed, progressFor, withStatus } from "@/lib/grammar-progress";
import { makeSession } from "@/lib/learning";
import { mistakeExercises } from "@/lib/mistakes";
import { questionStageIndex } from "@/lib/questions-progress";
import { dueQueue } from "@/lib/srs";
import type { Exercise, PlanTask } from "@/lib/types";
import { cn, localDate, nowIso } from "@/lib/utils";
import { vocabTranslateExercise } from "@/lib/vocab";
import { rankWeaknesses } from "@/lib/weakness";

const ORDER = ["vocab", "grammar", "sentences", "conversation", "quiz"];

function SessionInner() {
  const goal = useDailyGoal();
  const params = useSearchParams();
  const complete = useCompleteTask();
  const initial = params.get("block");
  const [active, setActive] = useState<string | null>(initial);

  if (!goal) {
    return (
      <div className="flex items-center gap-2 text-muted">
        <Spinner /> Po përgatis mësimin e sotëm…
      </div>
    );
  }
  const current = active ?? ORDER.find((id) => !goal.completedTaskIds.includes(id)) ?? null;
  const task = goal.tasks.find((t) => t.id === current);
  const doneAll = ORDER.every((id) => goal.completedTaskIds.includes(id));

  function done(id: string) {
    complete(id);
    const next = ORDER.find((x) => x !== id && !goal!.completedTaskIds.includes(x) && ORDER.indexOf(x) > ORDER.indexOf(id)) ?? ORDER.find((x) => x !== id && !goal!.completedTaskIds.includes(x));
    setActive(next ?? "summary");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Mësimi i sotëm" sq={`${goal.minutesTarget} minuta · ${localDate()}`} />
      <div className="grid gap-2 sm:grid-cols-5">
        {goal.tasks.map((t, i) => {
          const isDone = goal.completedTaskIds.includes(t.id);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-left transition-colors",
                current === t.id ? "border-accent bg-accent-soft" : "border-border bg-surface hover:bg-surface-2",
              )}
            >
              <span className="flex items-center justify-between text-xs text-muted">
                <span>{i + 1}. {t.minutes} min</span>
                {isDone && <Icon.check className="text-good" width={14} height={14} />}
              </span>
              <span className="mt-0.5 block text-sm font-medium">{t.titleSq}</span>
            </button>
          );
        })}
      </div>

      {(current === "summary" || (!task && doneAll)) && <Summary />}
      {task && (
        <Card className="bg-surface-2/50 p-4">
          <p className="text-sm"><span className="font-medium">{task.titleSq}</span> — <span className="text-muted">{task.reason}</span></p>
        </Card>
      )}
      {task?.id === "vocab" && <VocabBlock key={`v-${goal.id}`} onDone={() => done("vocab")} />}
      {task?.id === "grammar" && <GrammarBlock key={`g-${goal.id}`} task={task} onDone={() => done("grammar")} />}
      {task?.id === "sentences" && <SentencesBlock key={`s-${goal.id}`} task={task} onDone={() => done("sentences")} />}
      {task?.id === "conversation" && <ConversationBlock key={`c-${goal.id}`} task={task} onDone={() => done("conversation")} />}
      {task?.id === "quiz" && <QuizBlock key={`q-${goal.id}`} grammarTopic={goal.tasks.find((t) => t.id === "grammar")?.topicId} onDone={() => done("quiz")} />}
    </div>
  );
}

function VocabBlock({ onDone }: { onDone: () => void }) {
  const { db } = useData();
  const [cards] = useState(() => dueQueue(db.srs_cards, { max: 12, newLimit: 4 }));
  if (!cards.length)
    return (
      <Card className="flex items-center justify-between">
        <p className="text-sm text-muted">Asnjë fjalë për përsëritje sot. 👍</p>
        <Button onClick={onDone}>Weiter</Button>
      </Card>
    );
  return <FlashcardReview cards={cards} onDone={onDone} />;
}

function GrammarBlock({ task, onDone }: { task: PlanTask; onDone: () => void }) {
  const { db, commit } = useData();
  const topicId = task.topicId ?? "a1-questions";
  const topic = TOPIC_BY_ID[topicId];
  const p = progressFor(db, topicId);
  const [lessonRead, setLessonRead] = useState(Boolean(p.lessonViewedAt));
  const isQuestions = topicId === "a1-questions";
  const pool = useMemo(() => {
    if (isQuestions) {
      const stage = QUESTION_STAGES[questionStageIndex(db)];
      return [...stage.exercises, ...(topic?.exercises ?? [])];
    }
    return [...(topic?.exercises ?? []), ...(topic?.test ?? [])];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);
  const { exercises } = useFreshExercises({ key: `daily-grammar-${localDate()}-${topicId}`, topicId, pool, count: 8, aiShare: 0.5, enabled: lessonRead });
  const startedAt = useState(nowIso())[0];

  if (!topic) return null;
  if (!lessonRead) {
    return (
      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{topic.titleSq}</h2>
          <Badge>{topic.level}</Badge>
        </div>
        <p className="de text-muted">{topic.title}</p>
        {topic.explanationSq.slice(0, 3).map((x, i) => (
          <p key={i} className="text-[15px] leading-relaxed">{x}</p>
        ))}
        <div className="rounded-lg bg-surface-2 p-4">
          {topic.rule.map((r, i) => (
            <p key={i} className="de font-medium">{r}</p>
          ))}
        </div>
        <ul className="space-y-1.5">
          {topic.examples.slice(0, 3).map((e, i) => (
            <li key={i}>
              <span className="de">{e.de}</span> <Sq>— {e.sq}</Sq>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap justify-between gap-2">
          <LinkButton variant="secondary" href={`/grammar/${topic.id}`}>Mësimi i plotë</LinkButton>
          <Button
            onClick={() => {
              void commit({ grammar_progress: [withStatus(db, markLessonViewed(db, topicId))] });
              setLessonRead(true);
            }}
          >
            E lexova — tani ushtrime
          </Button>
        </div>
      </Card>
    );
  }
  if (!exercises) return <Card className="flex items-center gap-2 text-muted"><Spinner /> Mentori po përgatit ushtrime të reja për ty…</Card>;
  return (
    <ExerciseRunner
      exercises={exercises}
      source="daily"
      onComplete={(r) => {
        void commit({ learning_sessions: [makeSession("daily", startedAt, r, { summary: `Grammatik: ${topic.title}`, topicIds: [topicId] })] });
        onDone();
      }}
    />
  );
}

function SentencesBlock({ task, onDone }: { task: PlanTask; onDone: () => void }) {
  const { db, commit } = useData();
  const startedAt = useState(nowIso())[0];
  const [items] = useState<Exercise[]>(() => {
    const weak = rankWeaknesses(db).slice(0, 3).map((w) => w.topicId);
    if (task.topicId && !weak.includes(task.topicId)) weak.push(task.topicId);
    const pool = ALL_GRAMMAR_EXERCISES.filter((e) => weak.includes(e.topicId) && ["order", "translate", "transform"].includes(e.type));
    const fromMistakes = mistakeExercises(db.mistakes.filter((m) => !m.resolved).sort((a, b) => b.count - a.count).slice(0, 3));
    const bank = pickExercises(db, pool, 7 - fromMistakes.length, { seed: "sentences" });
    return [...fromMistakes, ...bank].sort(() => Math.random() - 0.5);
  });
  return (
    <ExerciseRunner
      exercises={items}
      source="daily"
      onComplete={(r) => {
        void commit({ learning_sessions: [makeSession("daily", startedAt, r, { summary: "Sätze bauen" })] });
        onDone();
      }}
    />
  );
}

function ConversationBlock({ task, onDone }: { task: PlanTask; onDone: () => void }) {
  const sc = SCENARIO_BY_ID[task.scenarioId ?? "intro"];
  const [finished, setFinished] = useState(false);
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Tema: <span className="font-medium text-text">{sc.titleSq}</span> — {sc.descriptionSq} Përgjigju me fjali të plota (me zë nëse mundesh).
      </p>
      <ConversationPanel
        mode="daily"
        scenarioId={sc.id}
        title={sc.title}
        level={sc.level}
        scenario={{ title: sc.title, context: sc.context, level: sc.level }}
        opening={{ german: sc.questions[0].de, albanian: sc.questions[0].sq }}
        script={sc.questions.map((q) => ({ prompt: q.de, promptSq: q.sq, model: q.model }))}
        maxTurns={6}
        onEnd={() => setFinished(true)}
      />
      {finished && (
        <div className="flex justify-end">
          <Button onClick={onDone}>Weiter te kuizi</Button>
        </div>
      )}
    </div>
  );
}

function QuizBlock({ grammarTopic, onDone }: { grammarTopic?: string; onDone: () => void }) {
  const { db, commit } = useData();
  const startedAt = useState(nowIso())[0];
  const [items] = useState<Exercise[]>(() => {
    const today = new Set(db.skill_evidence.filter((e) => localDate(e.at) === localDate()).map((e) => e.itemId));
    const weak = rankWeaknesses(db).slice(0, 4).map((w) => w.topicId);
    const topics = [...new Set([grammarTopic, ...weak].filter(Boolean) as string[])];
    const pool = topics.flatMap((t) => TOPIC_BY_ID[t]?.test ?? []);
    const g = pickExercises(db, pool, 5, { exclude: today, seed: "quiz" });
    const words = db.vocabulary.filter((w) => db.srs_cards.find((c) => c.itemId === w.id && c.totalReviews > 0));
    const v = pickExercises(db, words.map(vocabTranslateExercise), 3, { exclude: today, seed: "quizv" });
    return [...g, ...v];
  });
  return (
    <ExerciseRunner
      exercises={items}
      source="daily"
      finishLabel="Përfundo mësimin"
      onComplete={(r) => {
        void commit({ learning_sessions: [makeSession("daily", startedAt, r, { summary: "Quiz" })] });
        onDone();
      }}
    />
  );
}

function Summary() {
  const { db } = useData();
  const today = localDate();
  const ev = db.skill_evidence.filter((e) => localDate(e.at) === today);
  const acc = ev.length ? ev.reduce((a, e) => a + e.score, 0) / ev.length : null;
  const mistakes = db.mistakes.filter((m) => m.dates.some((d) => localDate(d) === today));
  return (
    <Card className="space-y-4">
      <h2 className="text-lg font-semibold">Mësimi i sotëm përfundoi 🎉</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-surface-2 p-3"><p className="text-xs text-muted">Ushtrime</p><p className="text-xl font-semibold">{ev.length}</p></div>
        <div className="rounded-lg bg-surface-2 p-3"><p className="text-xs text-muted">Saktësia</p><p className="text-xl font-semibold">{acc === null ? "–" : `${Math.round(acc * 100)}%`}</p></div>
        <div className="rounded-lg bg-surface-2 p-3"><p className="text-xs text-muted">Gabime të regjistruara</p><p className="text-xl font-semibold">{mistakes.length}</p></div>
      </div>
      {mistakes.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Gabimet e sotme (do t'i përsërisim nesër)</p>
          <ul className="space-y-1 text-sm">
            {mistakes.slice(0, 6).map((m) => (
              <li key={m.id}><span className="de text-bad line-through">{m.original}</span> → <span className="de text-good">{m.corrected}</span></li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <LinkButton href="/">Te paneli</LinkButton>
        <LinkButton href="/speaking" variant="secondary">Më shumë të folur</LinkButton>
        <Link href="/mistakes" className="self-center text-sm text-muted underline">Gabimet e mia</Link>
      </div>
    </Card>
  );
}

export default function SessionPage() {
  return (
    <Suspense>
      <SessionInner />
    </Suspense>
  );
}
