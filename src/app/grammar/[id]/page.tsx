"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { TOPIC_BY_ID } from "@/content/grammar";
import { ExerciseRunner, SpeakButton } from "@/components/ExerciseRunner";
import { useData } from "@/components/providers/DataProvider";
import { useFreshExercises } from "@/components/useFreshExercises";
import { Badge, Button, Card, CardTitle, EmptyState, Notice, PageHeader, Spinner, Sq, Tabs } from "@/components/ui";
import { mergeChanges } from "@/lib/db/changes";
import { DEMONSTRATED_SCORE, STATUS_LABEL, applyTest, computeStatus, markLessonViewed, progressFor, unlockedLevels, withStatus } from "@/lib/grammar-progress";
import { makeSession } from "@/lib/learning";
import { mistakeExercises } from "@/lib/mistakes";
import { cn, nowIso } from "@/lib/utils";

type TabKey = "lesson" | "practice" | "test" | "mistakes";

export default function TopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const topic = TOPIC_BY_ID[id];
  const { db, commit } = useData();
  const [tab, setTab] = useState<TabKey>("lesson");
  const [run, setRun] = useState(0);
  const [lastTest, setLastTest] = useState<number | null>(null);

  useEffect(() => {
    if (topic && unlockedLevels(db).includes(topic.level) && !progressFor(db, id).lessonViewedAt) {
      void commit({ grammar_progress: [withStatus(db, markLessonViewed(db, id))] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!topic) return <EmptyState title="Tema nuk u gjet." />;
  if (!unlockedLevels(db).includes(topic.level))
    return (
      <Notice tone="warn">
        Kjo temë ({topic.level}) është ende e kyçur. Provo të paktën 60% të temave të nivelit të mëparshëm me test ≥ 80%. <Link href="/grammar" className="underline">Kthehu</Link>
      </Notice>
    );

  const p = progressFor(db, id);
  const status = computeStatus(db, id);
  const topicMistakes = db.mistakes.filter((m) => m.topicId === id && !m.resolved);

  return (
    <div className="space-y-6">
      <PageHeader title={topic.titleSq} sq={`${topic.title} · ${topic.level}`}>
        <Badge tone="accent">{STATUS_LABEL[status].sq}</Badge>
      </PageHeader>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={tab}
          onChange={(v) => { setTab(v); setRun((r) => r + 1); }}
          items={[
            { value: "lesson", label: "1. Mësimi" },
            { value: "practice", label: "2. Ushtrime" },
            { value: "test", label: "3. Test" },
            { value: "mistakes", label: `Gabimet (${topicMistakes.length})` },
          ]}
        />
        <p className="text-xs text-muted">
          Ushtrime: {p.exerciseCorrect}/{p.exerciseAttempts} · Testi më i mirë: {p.testAttempts ? `${Math.round(p.testBestScore * 100)}%` : "–"}
          {p.nextReviewAt && ` · Përsëritja: ${p.nextReviewAt.slice(0, 10)}`}
        </p>
      </div>

      {tab === "lesson" && <Lesson id={id} onPractice={() => setTab("practice")} />}
      {tab === "practice" && <Practice key={run} id={id} onDone={() => setTab("test")} />}
      {tab === "test" && (
        <div className="space-y-4">
          <Notice tone="info">
            Testi tregon nëse e ke kuptuar temën. Me ≥ {Math.round(DEMONSTRATED_SCORE * 100)}% tema shënohet si "e provuar". Për ta "zotëruar", duhet ta kalosh sërish pas disa ditësh (përsëritje e shpërndarë).
          </Notice>
          {lastTest !== null && (
            <Notice tone={lastTest >= DEMONSTRATED_SCORE ? "good" : "warn"}>
              Rezultati: {Math.round(lastTest * 100)}%. {lastTest >= DEMONSTRATED_SCORE ? "Shumë mirë! Do ta përsërisim pas disa ditësh." : "Ende jo — ushtro edhe pak dhe provo përsëri nesër."}
            </Notice>
          )}
          <ExerciseRunner
            key={`t${run}`}
            exercises={topic.test}
            source="grammar"
            finishLabel="Ruaj rezultatin"
            onComplete={(r) => {
              const score = r.length ? r.reduce((a, x) => a + x.score, 0) / r.length : 0;
              const fresh = progressFor(db, id);
              const kind = fresh.testBestScore >= DEMONSTRATED_SCORE ? "review" : "test";
              const updated = withStatus(db, applyTest(fresh, score, kind));
              void commit(mergeChanges({ grammar_progress: [updated] }, { learning_sessions: [makeSession("grammar", nowIso(), r, { summary: `Test: ${topic.title}`, topicIds: [id] })] }));
              setLastTest(score);
              setRun((x) => x + 1);
            }}
          />
        </div>
      )}
      {tab === "mistakes" &&
        (topicMistakes.length ? (
          <ExerciseRunner key={`m${run}`} exercises={mistakeExercises(topicMistakes)} source="mistakes" onComplete={() => setRun((x) => x + 1)} />
        ) : (
          <EmptyState title="Asnjë gabim aktiv për këtë temë.">Gabimet nga bisedat dhe ushtrimet shfaqen këtu automatikisht.</EmptyState>
        ))}
    </div>
  );
}

function Lesson({ id, onPractice }: { id: string; onPractice: () => void }) {
  const topic = TOPIC_BY_ID[id];
  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-6">
        <Card>
          <CardTitle>Shpjegimi (shqip)</CardTitle>
          <div className="space-y-3 text-[15px] leading-relaxed">
            {topic.explanationSq.map((x, i) => <p key={i}>{x}</p>)}
          </div>
        </Card>
        <Card>
          <CardTitle>Rregulli</CardTitle>
          <div className="space-y-1.5">
            {topic.rule.map((r, i) => <p key={i} className="de rounded-md bg-surface-2 px-3 py-2 font-medium">{r}</p>)}
          </div>
          {topic.table && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted">
                    {topic.table.headers.map((h) => <th key={h} className="py-2 pr-4 font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {topic.table.rows.map((row, i) => (
                    <tr key={i} className="border-b border-border/60">
                      {row.map((c, j) => <td key={j} className={cn("py-2 pr-4", j > 0 && "de")}>{c}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
      <div className="space-y-6">
        <Card>
          <CardTitle>Shembuj</CardTitle>
          <ul className="space-y-3">
            {topic.examples.map((e, i) => (
              <li key={i}>
                <div className="flex items-center gap-1"><p className="de text-[16px]">{e.de}</p><SpeakButton text={e.de} /></div>
                <Sq force>{e.sq}</Sq>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle>Gabime të zakonshme</CardTitle>
          <ul className="space-y-3 text-sm">
            {topic.commonMistakes.map((m, i) => (
              <li key={i}>
                <p className="de text-bad line-through decoration-1">{m.wrong}</p>
                <p className="de font-medium text-good">{m.right}</p>
                <p className="text-muted">{m.whySq}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Button className="w-full" onClick={onPractice}>Kalo te ushtrimet</Button>
      </div>
    </div>
  );
}

function Practice({ id, onDone }: { id: string; onDone: () => void }) {
  const topic = TOPIC_BY_ID[id];
  const { commit } = useData();
  const [startedAt] = useState(nowIso());
  const { exercises, aiCount } = useFreshExercises({ key: `practice-${id}-${startedAt}`, topicId: id, pool: topic.exercises, count: 8, aiShare: 0.4 });
  if (!exercises) return <Card className="flex items-center gap-2 text-muted"><Spinner /> Po përgatis ushtrimet…</Card>;
  return (
    <div className="space-y-3">
      {aiCount > 0 && <p className="text-xs text-muted">{aiCount} ushtrime të reja të krijuara nga mentori sipas gabimeve të tua.</p>}
      <ExerciseRunner
        exercises={exercises}
        source="grammar"
        finishLabel="Te testi"
        onComplete={(r) => {
          void commit({ learning_sessions: [makeSession("grammar", startedAt, r, { summary: `Übung: ${topic.title}`, topicIds: [id] })] });
          onDone();
        }}
      />
    </div>
  );
}
