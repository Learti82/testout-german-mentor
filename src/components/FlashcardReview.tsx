"use client";

import { useState } from "react";
import { displayWord } from "@/content/vocabulary";
import { SpeakButton } from "@/components/ExerciseRunner";
import { useData } from "@/components/providers/DataProvider";
import { Badge, Button, Card, EmptyState, Progress } from "@/components/ui";
import { makeSession } from "@/lib/learning";
import { GRADE_LABELS, type Grade, effectiveStatus, newCard, review } from "@/lib/srs";
import type { SrsCard, VocabWord } from "@/lib/types";
import { nowIso } from "@/lib/utils";
import { flashcardEvidence } from "@/lib/vocab";

export function FlashcardReview({ cards, direction = "de-sq", onDone }: { cards: SrsCard[]; direction?: "de-sq" | "sq-de"; onDone?: (stats: { reviewed: number; correct: number }) => void }) {
  const { db, commit } = useData();
  const [queue, setQueue] = useState(cards.map((c) => c.itemId));
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [startedAt] = useState(nowIso());
  const [total] = useState(cards.length);
  const words = new Map(db.vocabulary.map((w) => [w.id, w]));
  const cardMap = new Map(db.srs_cards.map((c) => [c.itemId, c]));

  const currentId = queue[0];
  const word: VocabWord | undefined = currentId ? words.get(currentId) : undefined;

  if (!total) return <EmptyState title="Asnjë fjalë për përsëritje tani.">Shumë mirë! Kthehu më vonë ose mëso fjalë të reja.</EmptyState>;

  if (!word) {
    return (
      <Card className="text-center">
        <p className="text-lg font-semibold">Përsëritja mbaroi</p>
        <p className="mt-1 text-sm text-muted">{reviewed} karta · {correct} të ditura</p>
        <Button className="mt-4" onClick={() => onDone?.({ reviewed, correct })}>Weiter</Button>
      </Card>
    );
  }

  function grade(g: Grade) {
    const card = cardMap.get(word!.id) ?? newCard("vocab", word!.id);
    const updated = review(card, g);
    const status = effectiveStatus(word!, updated);
    const changes = {
      srs_cards: [updated],
      skill_evidence: [flashcardEvidence(word!, g)],
      vocabulary: [{ ...word!, status: word!.statusManual ? word!.status : status }],
    };
    const nextQueue = queue.slice(1);
    // wrong answers come back at the end of this session
    if (g === 0) nextQueue.push(word!.id);
    const newReviewed = reviewed + 1;
    const newCorrect = correct + (g >= 2 ? 1 : 0);
    setReviewed(newReviewed);
    setCorrect(newCorrect);
    setQueue(nextQueue);
    setFlipped(false);
    if (!nextQueue.length) {
      void commit({ ...changes, learning_sessions: [makeSession("vocabulary", startedAt, Array.from({ length: newReviewed }, (_, i) => ({ score: i < newCorrect ? 1 : 0 })), { summary: "Flashcards" })] });
    } else void commit(changes);
  }

  const front = direction === "de-sq" ? displayWord(word) : word.albanian;
  const st = effectiveStatus(word, cardMap.get(word.id));
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs text-muted">
        <Progress value={reviewed / Math.max(total, reviewed + queue.length)} />
        <span className="tabular-nums">{queue.length} mbetur</span>
      </div>
      <Card className="flex min-h-[260px] flex-col items-center justify-center gap-3 text-center">
        <Badge tone={st === "difficult" ? "bad" : st === "new" ? "info" : "neutral"}>{st}</Badge>
        <div className="flex items-center gap-1">
          <p className={`text-3xl ${direction === "de-sq" ? "de" : "font-medium"}`}>{front}</p>
          {direction === "de-sq" && <SpeakButton text={displayWord(word)} />}
        </div>
        {flipped ? (
          <div className="space-y-2">
            <p className={`text-xl ${direction === "de-sq" ? "font-medium" : "de"}`}>{direction === "de-sq" ? word.albanian : displayWord(word)}</p>
            {word.plural && <p className="text-sm text-muted">Plural: <span className="de">{word.plural}</span></p>}
            <div className="flex items-center justify-center gap-1">
              <p className="de text-[16px]">{word.example}</p>
              <SpeakButton text={word.example} />
            </div>
            <p className="text-sm text-muted">{word.exampleSq}</p>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setFlipped(true)}>Trego përgjigjen</Button>
        )}
      </Card>
      {flipped && (
        <div className="grid grid-cols-4 gap-2">
          {([0, 1, 2, 3] as Grade[]).map((g) => (
            <Button key={g} variant={g === 0 ? "danger" : g === 2 ? "primary" : "secondary"} onClick={() => grade(g)}>
              <span className="flex flex-col leading-tight">
                <span>{GRADE_LABELS[g].sq}</span>
              </span>
            </Button>
          ))}
        </div>
      )}
      <p className="text-center text-xs text-muted">Thuaje fjalën me zë para se ta kthesh kartën. Ji i ndershëm me vlerësimin — fjalët e vështira kthehen më shpesh.</p>
    </div>
  );
}
