"use client";

import Link from "next/link";
import { useState } from "react";
import { TOPIC_BY_ID } from "@/content/grammar";
import { ExerciseRunner, SpeakButton } from "@/components/ExerciseRunner";
import { useData } from "@/components/providers/DataProvider";
import { Badge, Button, Card, EmptyState, PageHeader, Tabs } from "@/components/ui";
import { pickExercises } from "@/lib/exercise-select";
import { CATEGORY_LABEL, type MistakeGroup, groupMistakes, mistakeExercises, sourceLabel } from "@/lib/mistakes";
import { MISTAKE_CATEGORIES, type MistakeCategory } from "@/lib/types";

export default function MistakesPage() {
  const { db } = useData();
  const [view, setView] = useState<"groups" | "all">("groups");
  const [cat, setCat] = useState<MistakeCategory | "all">("all");
  const [showResolved, setShowResolved] = useState(false);
  const [practice, setPractice] = useState<MistakeGroup | "top" | null>(null);
  const [run, setRun] = useState(0);
  const groups = groupMistakes(db).filter((g) => cat === "all" || g.mistakes.some((m) => m.category === cat));
  const all = db.mistakes
    .filter((m) => (showResolved || !m.resolved) && (cat === "all" || m.category === cat))
    .sort((a, b) => b.count - a.count || b.lastSeenAt.localeCompare(a.lastSeenAt));
  const active = db.mistakes.filter((m) => !m.resolved);

  if (practice) {
    const ms = practice === "top" ? active.sort((a, b) => b.count - a.count).slice(0, 8) : practice.mistakes.filter((m) => !m.resolved);
    const topic = practice !== "top" ? TOPIC_BY_ID[practice.topicId] : null;
    const extra = topic ? pickExercises(db, [...topic.exercises, ...topic.test], 3, { seed: "mistakes" }) : [];
    return (
      <div className="space-y-4">
        <PageHeader title="Trajnim i gabimeve" sq="Korrigjo fjalitë që ke gabuar më parë. 3 herë radhazi saktë = gabimi shënohet si i zgjidhur.">
          <Button variant="ghost" onClick={() => setPractice(null)}>← Kthehu</Button>
        </PageHeader>
        <ExerciseRunner key={run} exercises={[...mistakeExercises(ms), ...extra]} source="mistakes" onComplete={() => { setPractice(null); setRun((r) => r + 1); }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Meine Fehler" sq="Çdo gabim nga bisedat dhe ushtrimet ruhet këtu — dhe përdoret për ushtrimet e ardhshme.">
        {active.length > 0 && <Button onClick={() => setPractice("top")}>Ushtro gabimet kryesore</Button>}
      </PageHeader>
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={view} onChange={setView} items={[{ value: "groups", label: "Sipas temës" }, { value: "all", label: "Të gjitha" }]} />
        <select value={cat} onChange={(e) => setCat(e.target.value as MistakeCategory | "all")} className="h-9 rounded-lg border border-border bg-surface px-2 text-sm">
          <option value="all">Të gjitha kategoritë</option>
          {MISTAKE_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c].sq}</option>)}
        </select>
        {view === "all" && (
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} /> Shfaq të zgjidhurat
          </label>
        )}
      </div>

      {!db.mistakes.length && <EmptyState title="Ende asnjë gabim i regjistruar.">Fol me mentorin ose bëj ushtrime — gabimet ruhen automatikisht me shpjegim në shqip.</EmptyState>}

      {view === "groups" && (
        <div className="space-y-4">
          {groups.map((g) => (
            <Card key={g.key}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{g.label}</p>
                  <p className="text-sm text-muted">{g.total} herë gjithsej · {g.recent} në 14 ditët e fundit · {g.mistakes.length} fjali të ndryshme</p>
                </div>
                <div className="flex gap-2">
                  {g.topicId && <Link href={`/grammar/${g.topicId}`} className="self-center text-sm text-muted underline">Mësimi</Link>}
                  <Button size="sm" disabled={!g.mistakes.some((m) => !m.resolved)} onClick={() => setPractice(g)}>Ushtro</Button>
                </div>
              </div>
              <p className="mt-3 rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent"><span className="font-medium">Rekomandim:</span> {g.recommendationSq}</p>
              <ul className="mt-3 divide-y divide-border">
                {g.mistakes.sort((a, b) => b.count - a.count).slice(0, 5).map((m) => (
                  <MistakeRow key={m.id} m={m} />
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

      {view === "all" && (
        <Card className="p-0">
          <ul className="divide-y divide-border px-5">
            {all.map((m) => <MistakeRow key={m.id} m={m} detailed />)}
          </ul>
        </Card>
      )}
    </div>
  );
}

function MistakeRow({ m, detailed }: { m: import("@/lib/types").Mistake; detailed?: boolean }) {
  return (
    <li className="py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="de text-bad line-through decoration-1">{m.original}</p>
          <div className="flex items-center gap-1">
            <p className="de font-medium text-good">{m.corrected}</p>
            <SpeakButton text={m.corrected} className="h-6 w-6" />
          </div>
          <p className="mt-0.5 text-sm text-muted">{m.explanationSq}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <Badge tone={m.count >= 3 ? "bad" : "warn"}>{m.count}×</Badge>
          <Badge>{CATEGORY_LABEL[m.category]?.sq}</Badge>
          {m.resolved && <Badge tone="good">i zgjidhur</Badge>}
          {!m.resolved && m.correctStreak > 0 && <Badge tone="info">{m.correctStreak}/3 saktë</Badge>}
        </div>
      </div>
      {detailed && (
        <p className="mt-1 text-xs text-muted">
          {m.label && `${m.label} · `}{TOPIC_BY_ID[m.topicId]?.titleSq ?? ""} · {sourceLabel(m.source)} · e para: {m.firstSeenAt.slice(0, 10)} · e fundit: {m.lastSeenAt.slice(0, 10)}
        </p>
      )}
    </li>
  );
}
