"use client";

import { useState } from "react";
import { QUESTION_STAGES, QUESTION_WORDS } from "@/content/questions";
import { ExerciseRunner, SpeakButton } from "@/components/ExerciseRunner";
import { Icon } from "@/components/icons";
import { useData } from "@/components/providers/DataProvider";
import { useFreshExercises } from "@/components/useFreshExercises";
import { Badge, Button, Card, CardTitle, PageHeader, Progress, Spinner, Sq } from "@/components/ui";
import { makeSession } from "@/lib/learning";
import { STAGE_MIN_ATTEMPTS, STAGE_PASS, questionStageIndex, stageStats, stageUnlocked } from "@/lib/questions-progress";
import { cn, nowIso } from "@/lib/utils";

export default function QuestionsPage() {
  const { db } = useData();
  const [active, setActive] = useState<number | null>(null);
  const [run, setRun] = useState(0);
  const current = questionStageIndex(db);

  return (
    <div className="space-y-6">
      <PageHeader title="Fragen-Trainer" sq="Pika jote më e dobët — këtu e ndërtojmë hap pas hapi, logjikisht." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Formula e pyetjes</CardTitle>
          <div className="space-y-4 text-sm">
            <div>
              <p className="mb-2 font-medium">1. W-Frage (me fjalë pyetëse)</p>
              <div className="flex flex-wrap gap-1.5">
                <Chip tone="info">W-Wort</Chip><Chip tone="accent">Verb</Chip><Chip>Subjekt</Chip><Chip tone="muted">Rest</Chip><Chip tone="muted">?</Chip>
              </div>
              <p className="de mt-2 text-[16px]">Wo <b>wohnst</b> du?</p>
              <Sq force>Fjala pyetëse në vendin 1, FOLJA në vendin 2, pastaj kryefjala.</Sq>
            </div>
            <div>
              <p className="mb-2 font-medium">2. Ja/Nein-Frage (pyetje Po/Jo)</p>
              <div className="flex flex-wrap gap-1.5">
                <Chip tone="accent">Verb</Chip><Chip>Subjekt</Chip><Chip tone="muted">Rest</Chip><Chip tone="muted">?</Chip>
              </div>
              <p className="de mt-2 text-[16px]"><b>Wohnst</b> du in Berlin?</p>
              <Sq force>Nuk ka "a" si në shqip — folja del në fillim.</Sq>
            </div>
            <div>
              <p className="mb-2 font-medium">3. Me dy folje (modale / Perfekt / e ndashme)</p>
              <p className="de text-[16px]">Wann <b>haben</b> Sie das Paket <u>bekommen</u>?</p>
              <p className="de text-[16px]"><b>Können</b> Sie mir <u>helfen</u>?</p>
              <Sq force>Folja e parë në vendin 2 (ose 1), folja e dytë NË FUND.</Sq>
            </div>
          </div>
        </Card>
        <Card>
          <CardTitle sub="Kliko ikonën për ta dëgjuar">Fjalët pyetëse</CardTitle>
          <div className="max-h-[360px] overflow-y-auto">
            <table className="w-full text-sm">
              <tbody>
                {QUESTION_WORDS.map((w) => (
                  <tr key={w.de} className="border-b border-border/60">
                    <td className="de py-2 pr-3 font-medium">{w.de}</td>
                    <td className="py-2 pr-3 text-muted">{w.sq}</td>
                    <td className="py-2">
                      <span className="flex items-center gap-1">
                        <span className="de">{w.example}</span>
                        <SpeakButton text={w.example} className="h-6 w-6" />
                      </span>
                      <Sq className="text-xs">{w.exampleSq}</Sq>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Nivelet</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {QUESTION_STAGES.map((s, i) => {
            const st = stageStats(db, i);
            const open = stageUnlocked(db, i);
            return (
              <Card key={s.id} className={cn(!open && "opacity-60", active === i && "border-accent")}>
                <div className="mb-2 flex items-center justify-between">
                  {open ? <Badge tone={i === current ? "accent" : "neutral"}>{i === current ? "aktual" : "i hapur"}</Badge> : <Badge><Icon.lock width={12} height={12} className="mr-1" /> i kyçur</Badge>}
                  <span className="text-xs text-muted">{st.attempts} përpjekje · {st.recentAccuracy === null ? "–" : `${Math.round(st.recentAccuracy * 100)}%`} (10 të fundit)</span>
                </div>
                <p className="font-medium">{s.titleSq}</p>
                <p className="mt-1 text-sm text-muted">{s.descriptionSq}</p>
                <Progress className="mt-3" value={Math.min(1, st.attempts / STAGE_MIN_ATTEMPTS) * Math.min(1, (st.recentAccuracy ?? 0) / STAGE_PASS)} />
                <div className="mt-3 flex justify-end">
                  <Button size="sm" disabled={!open} onClick={() => { setActive(i); setRun((r) => r + 1); }}>Ushtro</Button>
                </div>
              </Card>
            );
          })}
        </div>
        <p className="text-xs text-muted">Niveli tjetër hapet me ≥{Math.round(STAGE_PASS * 100)}% saktësi në 10 përpjekjet e fundit (të paktën {STAGE_MIN_ATTEMPTS}).</p>
      </section>

      {active !== null && <StagePractice key={`${active}-${run}`} idx={active} onDone={() => setRun((r) => r + 1)} />}
    </div>
  );
}

function StagePractice({ idx, onDone }: { idx: number; onDone: () => void }) {
  const { commit } = useData();
  const stage = QUESTION_STAGES[idx];
  const [startedAt] = useState(nowIso());
  const topicId = idx === 3 ? "b1-nebensatz" : "a1-questions";
  const { exercises } = useFreshExercises({ key: `qs-${idx}-${startedAt}`, topicId, pool: stage.exercises, count: 8, aiShare: 0.25, types: ["translate", "transform", "fix"] });
  if (!exercises) return <Card className="flex items-center gap-2 text-muted"><Spinner /> Po përgatis pyetjet…</Card>;
  return (
    <section id="practice" className="space-y-3">
      <h2 className="text-lg font-semibold">{stage.titleSq}</h2>
      <ExerciseRunner
        exercises={exercises}
        source="questions"
        onComplete={(r) => {
          void commit({ learning_sessions: [makeSession("questions", startedAt, r, { summary: stage.title, topicIds: [topicId] })] });
          onDone();
        }}
      />
    </section>
  );
}

function Chip({ children, tone }: { children: React.ReactNode; tone?: "info" | "accent" | "muted" }) {
  return (
    <span className={cn("rounded-md px-2 py-1 text-xs font-medium", tone === "accent" ? "bg-accent text-accent-fg" : tone === "info" ? "bg-info-soft text-info" : tone === "muted" ? "bg-surface-2 text-muted" : "bg-warn-soft text-warn")}>
      {children}
    </span>
  );
}
