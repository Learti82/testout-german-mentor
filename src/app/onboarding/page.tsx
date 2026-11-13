"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { PLACEMENT } from "@/content/assessment";
import { TOPIC_BY_ID } from "@/content/grammar";
import { ConversationPanel } from "@/components/ConversationPanel";
import { ExerciseRunner } from "@/components/ExerciseRunner";
import { useData } from "@/components/providers/DataProvider";
import { Badge, Button, Card, CardTitle, Notice, PageHeader, Progress, Spinner } from "@/components/ui";
import { ai } from "@/lib/ai/client";
import type { ExerciseResult } from "@/lib/learning";
import { makeSession } from "@/lib/learning";
import { buildMentorContext } from "@/lib/memory";
import { buildStudyPlan } from "@/lib/session-plan";
import type { CEFR, StudyPlan } from "@/lib/types";
import { PlanCard } from "@/components/PlanCard";
import { addDays, localDate, nowIso, uid } from "@/lib/utils";

type Step = "intro" | "sentences" | "questions" | "grammar" | "conversation" | "results";
const STEPS: Step[] = ["intro", "sentences", "questions", "grammar", "conversation", "results"];
const STEP_LABEL: Record<Step, string> = {
  intro: "Prezantimi",
  sentences: "Ndërtimi i fjalive",
  questions: "Pyetjet",
  grammar: "Gramatika bazë",
  conversation: "Bisedë e shkurtër",
  results: "Rezultati dhe plani",
};

export default function Onboarding() {
  const { db, commit, profile, ai: aiStatus } = useData();
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [name, setName] = useState(profile.displayName);
  const [minutes, setMinutes] = useState(profile.dailyMinutes);
  const results = useRef<Record<string, ExerciseResult[]>>({});
  const [convScore, setConvScore] = useState<number | null>(null);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [summary, setSummary] = useState<{ level: CEFR; sections: { label: string; score: number | null }[]; weak: { topicId: string; acc: number }[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const startedAt = useRef(nowIso());

  const idx = STEPS.indexOf(step);

  async function finish(conversationScore: number | null) {
    setBusy(true);
    const all = Object.values(results.current).flat();
    const acc = (rs: ExerciseResult[]) => (rs.length ? rs.reduce((a, r) => a + r.score, 0) / rs.length : null);
    const atLevel = (l: CEFR) => acc(all.filter((r) => r.exercise.level === l));
    const a1 = atLevel("A1") ?? 0;
    const a2 = atLevel("A2") ?? 0;
    const level: CEFR = a1 >= 0.75 ? (a2 >= 0.75 ? "B1" : "A2") : "A1";

    const byTopic = new Map<string, number[]>();
    for (const r of all) byTopic.set(r.exercise.topicId, [...(byTopic.get(r.exercise.topicId) ?? []), r.score]);
    const weak = [...byTopic.entries()]
      .map(([topicId, s]) => ({ topicId, acc: s.reduce((a, b) => a + b, 0) / s.length }))
      .filter((w) => w.acc < 0.75 && TOPIC_BY_ID[w.topicId])
      .sort((a, b) => a.acc - b.acc);

    const sections = [
      { label: "Ndërtimi i fjalive", score: acc(results.current.sentences ?? []) },
      { label: "Pyetjet", score: acc(results.current.questions ?? []) },
      { label: "Gramatika", score: acc(results.current.grammar ?? []) },
      { label: "Biseda", score: conversationScore },
    ];
    setSummary({ level, sections, weak });

    // Known weaknesses = verified by the test (+ the original list for topics not tested).
    const tested = new Set(byTopic.keys());
    const knownWeaknesses = [...new Set([...weak.map((w) => w.topicId), ...profile.knownWeaknesses.filter((t) => !tested.has(t))])];
    const updatedProfile = {
      ...profile,
      displayName: name.trim(),
      dailyMinutes: minutes,
      knownWeaknesses,
      placementLevel: level,
      placementCompletedAt: nowIso(),
      onboardingCompleted: true,
      updatedAt: nowIso(),
    };
    const dbAfter = { ...db, profile: [updatedProfile] };
    let p = buildStudyPlan(dbAfter);
    if (aiStatus?.available) {
      try {
        const r = await ai.plan({ context: buildMentorContext(dbAfter), results: { level, sections, weak: weak.map((w) => ({ topic: w.topicId, accuracy: w.acc })) } });
        if (r.days?.length >= 5) {
          p = {
            id: uid(),
            createdAt: nowIso(),
            startsOn: localDate(),
            rationale: r.rationaleSq,
            generatedBy: "ai",
            days: r.days.slice(0, 7).map((d, i) => ({
              day: i + 1,
              date: localDate(addDays(new Date(), i)),
              focus: d.focusSq,
              focusSq: d.focusSq,
              topicIds: d.topicIds.filter((t) => TOPIC_BY_ID[t]),
              tasks: d.tasks,
            })),
          };
        }
      } catch {
        /* rules-based plan stays */
      }
    }
    setPlan(p);
    await commit({
      profile: [updatedProfile],
      study_plans: [p],
      learning_sessions: [makeSession("placement", startedAt.current, all, { summary: `Placement: ${level}`, topicIds: [...tested] })],
      mentor_memory: [
        {
          id: uid(),
          kind: "milestone",
          content: `Placement test ${localDate()}: working level ${level}. Weak: ${weak.map((w) => w.topicId).join(", ") || "none clear"}.`,
          topicId: "",
          importance: 3,
          createdAt: nowIso(),
        },
      ],
    });
    setBusy(false);
    setStep("results");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Mirë se erdhe te mentori yt" sq="Vlerësimi fillestar — rreth 15 minuta" />
      <div>
        <div className="mb-2 flex flex-wrap gap-2 text-xs">
          {STEPS.map((s, i) => (
            <span key={s} className={i === idx ? "font-medium text-accent" : i < idx ? "text-text" : "text-muted"}>
              {i + 1}. {STEP_LABEL[s]}
              {i < STEPS.length - 1 && <span className="ml-2 text-muted">·</span>}
            </span>
          ))}
        </div>
        <Progress value={idx / (STEPS.length - 1)} />
      </div>

      {step === "intro" && (
        <Card className="space-y-5">
          <div className="space-y-2">
            <p className="de text-xl">Hallo! Ich bin dein persönlicher Deutsch-Mentor.</p>
            <p className="text-muted">
              Përshëndetje! Unë jam mentori yt personal i gjermanishtes. Do të mësojmë bashkë: do të flasim, do të ndërtojmë fjali, do të të korrigjoj dhe do të të shpjegoj gabimet në shqip.
            </p>
          </div>
          <div className="rounded-lg bg-surface-2 p-4 text-sm">
            <p className="mb-2 font-medium">Profili yt (i ngarkuar)</p>
            <ul className="space-y-1 text-muted">
              <li>Gjuha amtare: shqip · Niveli i deklaruar: fillestar, A1/A2</li>
              <li>Qëllimi: B1 → B2, punë në një call center gjerman</li>
              <li>Pikat e dobëta të njohura: pyetjet, renditja e fjalëve, foljet vetvetore, haben/sein, kohët, lidhëzat, foljet e ndashme, fjalitë e varura</li>
              <li>Fjalor i parë: die Anfrage, die Bestellung, die Rechnung, der Ersatz, die Rückerstattung, senden, machen, bereit sein, Zeit haben</li>
            </ul>
          </div>
          <Notice tone="info">
            Nuk do ta supozoj nivelin tënd nga profili — do ta verifikojmë me një test të shkurtër. Mos u shqetëso për gabimet: ato më tregojnë çfarë duhet të ushtrojmë.
          </Notice>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-muted">Si të thërras? (opsionale)</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="h-10 w-full rounded-lg border border-border bg-surface px-3 outline-none focus:border-accent" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted">Sa minuta në ditë?</span>
              <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="h-10 w-full rounded-lg border border-border bg-surface px-3">
                {[20, 30, 35, 45, 60].map((m) => (
                  <option key={m} value={m}>{m} minuta</option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setStep("sentences")}>Fillojmë</Button>
          </div>
        </Card>
      )}

      {step === "sentences" && (
        <Section title="1. Ndërtimi i fjalive" sq="Rendit fjalët dhe përkthe fjalitë.">
          <ExerciseRunner exercises={PLACEMENT.sentences} source="placement" showSummary={false} onComplete={(r) => { results.current.sentences = r; setStep("questions"); }} />
        </Section>
      )}
      {step === "questions" && (
        <Section title="2. Formimi i pyetjeve" sq="Një nga pikat e tua të dobëta — le ta shohim.">
          <ExerciseRunner exercises={PLACEMENT.questions} source="placement" showSummary={false} onComplete={(r) => { results.current.questions = r; setStep("grammar"); }} />
        </Section>
      )}
      {step === "grammar" && (
        <Section title="3. Gramatika bazë" sq="Pyetje të shkurtra nga A1 deri B1.">
          <ExerciseRunner exercises={PLACEMENT.grammar} source="placement" showSummary={false} onComplete={(r) => { results.current.grammar = r; setStep("conversation"); }} />
        </Section>
      )}
      {step === "conversation" && (
        <Section title="4. Bisedë e shkurtër" sq="Përgjigju me zë ose me shkrim, me fjali të plota. 3 pyetje.">
          {busy ? (
            <Card className="flex items-center gap-3 text-muted"><Spinner /> Po analizoj rezultatet dhe po krijoj planin tënd 7-ditor…</Card>
          ) : (
            <>
              <ConversationPanel
                mode="placement"
                scenarioId="placement"
                title="Einstufungsgespräch"
                level="A2"
                scenario={{ title: "Placement", context: "Ask (one by one): about the learner, last weekend (Perfekt), and why they learn German (weil). After the third answer, thank them.", level: "A2" }}
                opening={{ german: PLACEMENT.conversation[0].de, albanian: PLACEMENT.conversation[0].sq }}
                script={PLACEMENT.conversation.map((c) => ({ prompt: c.de, promptSq: c.sq, model: c.model }))}
                maxTurns={3}
                autoAudioDefault
                recordSession={false}
                onEnd={(r) => {
                  setConvScore(r.avgScore);
                  void finish(r.avgScore);
                }}
              />
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => finish(convScore)}>Kalo bisedën</Button>
              </div>
            </>
          )}
        </Section>
      )}

      {step === "results" && summary && (
        <div className="space-y-6">
          <Card>
            <CardTitle sub="Bazuar vetëm në këtë test të shkurtër — do të saktësohet me çdo ushtrim">Rezultati i vlerësimit</CardTitle>
            <div className="mb-5 flex items-center gap-3">
              <span className="text-4xl font-semibold">{summary.level}</span>
              <span className="text-sm text-muted">
                {summary.level === "A1" ? "Fillojmë me bazat e A1 dhe i forcojmë." : summary.level === "A2" ? "Bazat e A1 janë mirë — punojmë në A2 (A2 u hap)." : "A1 dhe A2 janë të forta — punojmë drejt B1."}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {summary.sections.map((s) => (
                <div key={s.label} className="rounded-lg bg-surface-2 p-3">
                  <p className="text-xs text-muted">{s.label}</p>
                  <p className="text-xl font-semibold tabular-nums">{s.score === null ? "–" : `${Math.round(s.score * 100)}%`}</p>
                </div>
              ))}
            </div>
            {summary.weak.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-sm font-medium">Dobësitë e konfirmuara</p>
                <div className="flex flex-wrap gap-2">
                  {summary.weak.map((w) => (
                    <Badge key={w.topicId} tone="bad">{TOPIC_BY_ID[w.topicId]?.titleSq} · {Math.round(w.acc * 100)}%</Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
          {plan && <PlanCard plan={plan} />}
          <div className="flex justify-end">
            <Button onClick={() => router.push("/")}>Te paneli im</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, sq, children }: { title: string; sq: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted">{sq}</p>
      </div>
      {children}
    </section>
  );
}
