"use client";

import { useMemo, useState } from "react";
import { SPEAKING_SCENARIOS, type SpeakingScenario } from "@/content/scenarios";
import { ConversationPanel } from "@/components/ConversationPanel";
import { PronunciationDrill } from "@/components/PronunciationDrill";
import { useData } from "@/components/providers/DataProvider";
import { Badge, Button, Card, PageHeader, Tabs } from "@/components/ui";
import { estimateLevel } from "@/lib/level";
import { CEFR_LEVELS } from "@/lib/types";
import { cn, formatMinutes, shuffle } from "@/lib/utils";
import { speakingSeconds } from "@/lib/stats";

export default function SpeakingPage() {
  const { db } = useData();
  const [tab, setTab] = useState<"conversation" | "pronunciation">("conversation");
  const [scenario, setScenario] = useState<SpeakingScenario | null>(null);
  const [run, setRun] = useState(0);
  const working = estimateLevel(db).working;
  const lastUsed = new Map(db.conversations.filter((c) => c.mode === "speaking").map((c) => [c.scenarioId, c.updatedAt]));
  const drill = useMemo(
    () => shuffle(SPEAKING_SCENARIOS.flatMap((s) => s.questions.map((q, i) => ({ id: `${s.id}-${i}`, de: q.model, sq: "", level: s.level })))).filter((d) => CEFR_LEVELS.indexOf(d.level) <= CEFR_LEVELS.indexOf(working)).slice(0, 8),
    [working],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Sprechen" sq={`Partneri yt i bisedës. Koha totale e të folurit: ${formatMinutes(speakingSeconds(db))}`}>
        <Tabs value={tab} onChange={(v) => setTab(v)} items={[{ value: "conversation", label: "Bisedë" }, { value: "pronunciation", label: "Përsërit pas meje" }]} />
      </PageHeader>

      {tab === "pronunciation" && <PronunciationDrill items={drill} />}

      {tab === "conversation" && !scenario && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SPEAKING_SCENARIOS.map((s) => {
            const fits = CEFR_LEVELS.indexOf(s.level) <= CEFR_LEVELS.indexOf(working);
            return (
              <button key={s.id} type="button" onClick={() => setScenario(s)} className="text-left">
                <Card className={cn("h-full transition-colors hover:border-accent", !fits && "opacity-70")}>
                  <div className="mb-2 flex items-center justify-between">
                    <Badge tone={fits ? "accent" : "warn"}>{s.level}</Badge>
                    {lastUsed.get(s.id) && <span className="text-xs text-muted">{lastUsed.get(s.id)!.slice(0, 10)}</span>}
                  </div>
                  <p className="font-medium">{s.titleSq}</p>
                  <p className="de text-sm text-muted">{s.title}</p>
                  <p className="mt-2 text-sm text-muted">{s.descriptionSq}</p>
                  {!fits && <p className="mt-2 text-xs text-warn">Pak mbi nivelin tënd aktual — sfidë!</p>}
                </Card>
              </button>
            );
          })}
        </div>
      )}

      {tab === "conversation" && scenario && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">{scenario.descriptionSq} Mentori bën një pyetje çdo herë, të korrigjon, dhe të kërkon ta përsëritësh fjalinë e saktë.</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setRun((r) => r + 1)}>Rifillo</Button>
              <Button variant="ghost" size="sm" onClick={() => setScenario(null)}>← Skenarët</Button>
            </div>
          </div>
          <ConversationPanel
            key={`${scenario.id}-${run}`}
            mode="speaking"
            scenarioId={scenario.id}
            title={scenario.title}
            level={scenario.level}
            scenario={{ title: scenario.title, context: scenario.context, level: scenario.level }}
            opening={{ german: scenario.questions[0].de, albanian: scenario.questions[0].sq }}
            script={scenario.questions.map((q) => ({ prompt: q.de, promptSq: q.sq, model: q.model }))}
            evaluate
          />
        </div>
      )}
    </div>
  );
}
