"use client";

import { useMemo, useState } from "react";
import { CALL_SCENARIOS, type CallScenario, PHRASES, PHRASE_USES, type Phrase } from "@/content/callcenter";
import { ConversationPanel } from "@/components/ConversationPanel";
import { ExerciseRunner, SpeakButton } from "@/components/ExerciseRunner";
import { Icon } from "@/components/icons";
import { PronunciationDrill } from "@/components/PronunciationDrill";
import { useData } from "@/components/providers/DataProvider";
import { Badge, Button, Card, CardTitle, Notice, PageHeader, Sq, Tabs } from "@/components/ui";
import { estimateLevel } from "@/lib/level";
import { newCard } from "@/lib/srs";
import { CEFR_LEVELS, type DB, type Exercise } from "@/lib/types";
import { cn, nowIso, uid } from "@/lib/utils";

type TabKey = "sim" | "phrases" | "quiz" | "drill";

function passedScenarios(db: DB): Set<string> {
  const out = new Set<string>();
  for (const s of db.learning_sessions) {
    if (s.type !== "callcenter") continue;
    const id = (s.details as { scenarioId?: string }).scenarioId;
    const ev = (s.details as { evaluation?: { grammar: number; professionalism: number; comprehension: number } | null }).evaluation;
    const evScore = ev ? (ev.grammar + ev.professionalism + ev.comprehension) / 30 : null;
    const score = evScore ?? s.score;
    if (id && score !== null && score >= 0.6) out.add(id);
  }
  return out;
}

export default function CallCenterPage() {
  const { db } = useData();
  const [tab, setTab] = useState<TabKey>("sim");
  const [scenario, setScenario] = useState<CallScenario | null>(null);
  const [run, setRun] = useState(0);
  const passed = passedScenarios(db);
  const working = estimateLevel(db).working;
  const a2Passed = CALL_SCENARIOS.filter((s) => s.level === "A2" && passed.has(s.id)).length;
  const b1Open = a2Passed >= 3 || CEFR_LEVELS.indexOf(working) >= CEFR_LEVELS.indexOf("B1");

  return (
    <div className="space-y-6">
      <PageHeader title="Callcenter-Training" sq="Ti je punonjësi i shërbimit të klientit. Klienti flet gjermanisht — ti zgjidh problemin, me 'Sie' dhe profesionalisht.">
        <Tabs
          value={tab}
          onChange={(v) => { setTab(v); setRun((r) => r + 1); }}
          items={[
            { value: "sim", label: "Simulim" },
            { value: "phrases", label: "Frazat" },
            { value: "quiz", label: "Kuiz frazash" },
            { value: "drill", label: "Shqiptimi" },
          ]}
        />
      </PageHeader>

      {tab === "sim" && !scenario && (
        <>
          {!b1Open && (
            <Notice tone="info">
              Skenarët B1 hapen pasi të kalosh me sukses të paktën 3 skenarë A2 ({a2Passed}/3) — ose kur niveli yt të arrijë B1.
            </Notice>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CALL_SCENARIOS.map((s) => {
              const open = s.level === "A2" || b1Open;
              return (
                <button key={s.id} type="button" disabled={!open} onClick={() => setScenario(s)} className="text-left disabled:cursor-not-allowed">
                  <Card className={cn("h-full transition-colors", open ? "hover:border-accent" : "opacity-55")}>
                    <div className="mb-2 flex items-center justify-between">
                      <Badge tone={s.level === "A2" ? "accent" : "warn"}>{s.level}</Badge>
                      {passed.has(s.id) ? <Badge tone="good">✓ kaluar</Badge> : !open && <Icon.lock width={14} height={14} className="text-muted" />}
                    </div>
                    <p className="font-medium">{s.titleSq}</p>
                    <p className="de text-sm text-muted">{s.title}</p>
                    <p className="mt-2 text-sm text-muted">{s.situationSq}</p>
                  </Card>
                </button>
              );
            })}
          </div>
        </>
      )}

      {tab === "sim" && scenario && (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted">{scenario.situationSq}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setRun((r) => r + 1)}>Rifillo</Button>
                <Button size="sm" variant="ghost" onClick={() => setScenario(null)}>← Skenarët</Button>
              </div>
            </div>
            <ConversationPanel
              key={`${scenario.id}-${run}`}
              mode="callcenter"
              scenarioId={scenario.id}
              title={scenario.title}
              level={scenario.level}
              scenario={{ title: scenario.title, context: scenario.persona, level: scenario.level, goals: scenario.goals.map((g) => ({ id: g.id, de: g.de })) }}
              opening={{ german: scenario.opening, albanian: scenario.openingSq }}
              script={scenario.script.map((s) => ({ prompt: s.customer, promptSq: s.customerSq, model: s.model, expect: s.expect, hintSq: s.hintSq }))}
              goals={scenario.goals}
              evaluate
            />
          </div>
          <div className="space-y-4">
            <Card>
              <CardTitle>Objektivat</CardTitle>
              <ul className="space-y-2 text-sm">
                {scenario.goals.map((g) => (
                  <li key={g.id}>
                    <p>{g.sq}</p>
                    <p className="de text-xs text-muted">{g.de}</p>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <CardTitle>Fraza të dobishme</CardTitle>
              <ul className="space-y-2 text-sm">
                {scenario.phrases.map((id) => PHRASES.find((p) => p.id === id)).filter(Boolean).map((p) => (
                  <li key={p!.id}>
                    <div className="flex items-start gap-1"><span className="de">{p!.de}</span><SpeakButton text={p!.de} className="h-6 w-6" /></div>
                    <Sq className="text-xs">{p!.sq}</Sq>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}

      {tab === "phrases" && <Phrasebook />}
      {tab === "quiz" && <PhraseQuiz key={run} />}
      {tab === "drill" && <PronunciationDrill key={run} source="callcenter" items={PHRASES.slice().sort(() => Math.random() - 0.5).slice(0, 8).map((p) => ({ id: p.id, de: p.de, sq: p.sq, level: p.level }))} />}
    </div>
  );
}

function Phrasebook() {
  const { db, commit } = useData();
  const saved = new Set(db.vocabulary.map((w) => w.german));
  function add(p: Phrase) {
    const id = uid();
    void commit({
      vocabulary: [{ id, german: p.de, albanian: p.sq, article: null, plural: null, partOfSpeech: "phrase", example: p.de, exampleSq: p.sq, level: p.level, difficulty: 2, tags: ["callcenter"], status: "new", statusManual: false, source: "callcenter", createdAt: nowIso() }],
      srs_cards: [newCard("vocab", id)],
    });
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {(Object.keys(PHRASE_USES) as Phrase["use"][]).map((use) => (
        <Card key={use}>
          <CardTitle sub={PHRASE_USES[use].de}>{PHRASE_USES[use].sq}</CardTitle>
          <ul className="space-y-3">
            {PHRASES.filter((p) => p.use === use).map((p) => (
              <li key={p.id} className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-start gap-1"><span className="de text-[15px]">{p.de}</span><SpeakButton text={p.de} className="h-6 w-6" /></div>
                  <Sq force className="text-xs">{p.sq}</Sq>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge>{p.level}</Badge>
                  {saved.has(p.de) ? (
                    <span className="text-xs text-good">✓</span>
                  ) : (
                    <button type="button" className="text-xs text-muted hover:text-text" onClick={() => add(p)} title="Shto në kartat e fjalorit">+ karta</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}

function PhraseQuiz() {
  const items = useMemo<Exercise[]>(
    () =>
      PHRASES.slice()
        .sort(() => Math.random() - 0.5)
        .slice(0, 8)
        .map((p) => ({
          id: `phrase:${p.id}`,
          type: "translate",
          prompt: p.sq,
          promptSq: "Si e thua këtë si punonjës call center-i?",
          answers: [p.de],
          explanation: `${PHRASE_USES[p.use].sq}: ${p.de}`,
          topicId: "",
          level: p.level,
          skill: "speaking",
        })),
    [],
  );
  return <ExerciseRunner exercises={items} source="callcenter" />;
}
