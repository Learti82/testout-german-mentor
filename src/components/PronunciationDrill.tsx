"use client";

import { useEffect, useState } from "react";
import { SpeakButton } from "@/components/ExerciseRunner";
import { Icon } from "@/components/icons";
import { useData } from "@/components/providers/DataProvider";
import { Button, Card, Notice, Progress, Sq } from "@/components/ui";
import { compareSpoken } from "@/lib/answer-check";
import { makeSession } from "@/lib/learning";
import { speak, useSpeechRecognition } from "@/lib/speech";
import type { CEFR } from "@/lib/types";
import { cn, nowIso, uid } from "@/lib/utils";

export interface DrillItem {
  id: string;
  de: string;
  sq: string;
  level: CEFR;
}

/** Listen → repeat → see which words were recognised. Works without AI (browser speech recognition). */
export function PronunciationDrill({ items, source = "speaking" }: { items: DrillItem[]; source?: "speaking" | "callcenter" }) {
  const { commit, profile } = useData();
  const sr = useSpeechRecognition();
  const [i, setI] = useState(0);
  const [result, setResult] = useState<ReturnType<typeof compareSpoken> | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [startedAt] = useState(nowIso());
  const item = items[i];

  useEffect(() => {
    if (!sr.listening && sr.transcript && item) {
      const r = compareSpoken(sr.transcript, item.de);
      setResult(r);
      setScores((s) => [...s, r.similarity]);
      void commit({
        skill_evidence: [{ id: uid(), skill: "speaking", level: item.level, itemId: `pron:${item.id}`, topicId: "", score: r.similarity >= 0.85 ? 1 : r.similarity, at: nowIso(), source }],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sr.listening]);

  if (!sr.supported)
    return <Notice tone="warn">Ky shfletues nuk e mbështet njohjen e zërit. Përdor Chrome, Edge ose Safari për ushtrimet e shqiptimit.</Notice>;
  if (!item) {
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return (
      <Card className="text-center">
        <p className="text-lg font-semibold">Ushtrimi mbaroi</p>
        <p className="text-sm text-muted">Mesatarja e fjalëve të njohura: {Math.round(avg * 100)}%</p>
        <Button className="mt-4" onClick={() => { void commit({ learning_sessions: [makeSession(source, startedAt, scores.map((s) => ({ score: s })), { summary: "Aussprache" })] }); setI(0); setScores([]); setResult(null); }}>
          Edhe një herë
        </Button>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-3 text-xs text-muted">
        <Progress value={i / items.length} />
        <span className="tabular-nums">{i + 1}/{items.length}</span>
      </div>
      <div>
        <div className="flex items-center gap-1">
          <p className="de text-2xl">{item.de}</p>
          <SpeakButton text={item.de} />
        </div>
        <Sq>{item.sq}</Sq>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => speak(item.de, { rate: Math.max(0.6, profile.ttsRate - 0.2) })}>Dëgjo ngadalë</Button>
        <Button variant={sr.listening ? "danger" : "primary"} onClick={() => (sr.listening ? sr.stop() : (setResult(null), sr.start()))}>
          <Icon.mic /> {sr.listening ? "Stop" : "Përsërite"}
        </Button>
      </div>
      {sr.listening && <p className="de text-muted">{sr.transcript} {sr.interim}</p>}
      {result && (
        <div className="rounded-lg bg-surface-2 p-4">
          <p className="de flex flex-wrap gap-1 text-lg">
            {result.words.map((w, k) => (
              <span key={k} className={cn("rounded px-1", w.ok ? "bg-good-soft text-good" : "bg-bad-soft text-bad")}>{w.word}</span>
            ))}
          </p>
          <p className="mt-2 text-sm text-muted">
            {result.similarity >= 0.85 ? "Shkëlqyeshëm — u kuptua qartë." : result.similarity >= 0.6 ? "Mirë, por disa fjalë nuk u kuptuan. Dëgjoje përsëri dhe provo." : "Provo përsëri, ngadalë dhe qartë."}
          </p>
          <p className="mt-1 text-xs text-muted">Shënim: kjo mat nëse njohja e zërit të kupton — jo shqiptimin perfekt.</p>
        </div>
      )}
      {sr.error && <p className="text-sm text-bad">{sr.error}</p>}
      <div className="flex justify-end">
        <Button variant={result ? "primary" : "ghost"} onClick={() => { setResult(null); setI(i + 1); }}>{result ? "Weiter" : "Kalo"}</Button>
      </div>
    </Card>
  );
}
