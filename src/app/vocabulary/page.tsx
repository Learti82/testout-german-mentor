"use client";

import { useMemo, useState } from "react";
import { displayWord } from "@/content/vocabulary";
import { ExerciseRunner, SpeakButton } from "@/components/ExerciseRunner";
import { FlashcardReview } from "@/components/FlashcardReview";
import { useData } from "@/components/providers/DataProvider";
import { Badge, Button, Card, CardTitle, EmptyState, PageHeader, Stat, Tabs } from "@/components/ui";
import { pickExercises } from "@/lib/exercise-select";
import { applyManualStatus, dueQueue, effectiveStatus, newCard } from "@/lib/srs";
import { vocabCounts } from "@/lib/stats";
import { type CEFR, type Exercise, VOCAB_STATUSES, type VocabStatus, type VocabWord } from "@/lib/types";
import { nowIso, uid } from "@/lib/utils";
import { vocabFillExercise, vocabMcExercise, vocabTranslateExercise } from "@/lib/vocab";

type TabKey = "review" | "practice" | "list" | "add";
const STATUS_SQ: Record<VocabStatus, string> = { new: "E re", learning: "Në mësim", difficult: "E vështirë", known: "E njohur", mastered: "E zotëruar" };
const STATUS_TONE: Record<VocabStatus, "info" | "neutral" | "bad" | "accent" | "good"> = { new: "info", learning: "neutral", difficult: "bad", known: "accent", mastered: "good" };

export default function VocabularyPage() {
  const { db } = useData();
  const [tab, setTab] = useState<TabKey>("review");
  const [run, setRun] = useState(0);
  const counts = vocabCounts(db);
  const due = useMemo(() => dueQueue(db.srs_cards, { max: 25, newLimit: 6 }), [run]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <PageHeader title="Wortschatz" sq="Përsëritje e shpërndarë: fjalët e vështira kthehen më shpesh. Asnjë fjalë nuk bëhet 'e zotëruar' nga një përgjigje e vetme.">
        <Tabs
          value={tab}
          onChange={(v) => { setTab(v); setRun((r) => r + 1); }}
          items={[
            { value: "review", label: `Karta (${due.length})` },
            { value: "practice", label: "Ushtrime" },
            { value: "list", label: `Fjalori (${db.vocabulary.length})` },
            { value: "add", label: "+ Shto" },
          ]}
        />
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {VOCAB_STATUSES.map((s) => (
          <Card key={s} className="p-4"><Stat label={STATUS_SQ[s]} value={counts[s]} /></Card>
        ))}
      </div>

      {tab === "review" && <FlashcardReview key={run} cards={due} onDone={() => setRun((r) => r + 1)} />}
      {tab === "practice" && <Practice key={run} onDone={() => setRun((r) => r + 1)} />}
      {tab === "list" && <WordList />}
      {tab === "add" && <AddWord onAdded={() => setTab("list")} />}
    </div>
  );
}

function Practice({ onDone }: { onDone: () => void }) {
  const { db } = useData();
  const [mode, setMode] = useState<"mixed" | "de-sq" | "sq-de" | "fill" | "sentence">("mixed");
  const [run, setRun] = useState(0);
  const items = useMemo<Exercise[]>(() => {
    const cards = new Map(db.srs_cards.map((c) => [c.itemId, c]));
    // prioritise learning/difficult words
    const words = [...db.vocabulary].sort((a, b) => {
      const pa = ["difficult", "learning", "new", "known", "mastered"].indexOf(effectiveStatus(a, cards.get(a.id)));
      const pb = ["difficult", "learning", "new", "known", "mastered"].indexOf(effectiveStatus(b, cards.get(b.id)));
      return pa - pb;
    });
    const pick = words.slice(0, 16);
    let pool: Exercise[] = [];
    if (mode === "de-sq" || mode === "mixed") pool.push(...pick.map((w) => vocabMcExercise(w, db.vocabulary)));
    if (mode === "sq-de" || mode === "mixed") pool.push(...pick.map(vocabTranslateExercise));
    if (mode === "fill" || mode === "mixed") pool.push(...(pick.map(vocabFillExercise).filter(Boolean) as Exercise[]));
    if (mode === "sentence")
      pool = pick.map((w) => ({
        id: `vocabsent:${w.id}`,
        type: "free",
        prompt: `Bilde einen eigenen Satz mit „${displayWord(w)}“.`,
        promptSq: `Ndërto një fjali tënden me "${w.albanian}".`,
        answers: [w.example],
        explanation: `Shembull: ${w.example}`,
        topicId: "",
        level: w.level,
        skill: "writing",
      }));
    return pickExercises(db, pool, mode === "sentence" ? 5 : 10, { seed: mode + run });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, run]);

  if (!db.vocabulary.length) return <EmptyState title="Fjalori është bosh." />;
  return (
    <div className="space-y-4">
      <Tabs
        value={mode}
        onChange={(v) => { setMode(v); setRun((r) => r + 1); }}
        items={[
          { value: "mixed", label: "Të përziera" },
          { value: "de-sq", label: "DE → SQ" },
          { value: "sq-de", label: "SQ → DE" },
          { value: "fill", label: "Plotëso" },
          { value: "sentence", label: "Ndërto fjali" },
        ]}
      />
      <ExerciseRunner key={`${mode}${run}`} exercises={items} source="vocabulary" onComplete={() => { setRun((r) => r + 1); onDone(); }} />
    </div>
  );
}

function WordList() {
  const { db, commit, remove } = useData();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<VocabStatus | "all">("all");
  const cards = new Map(db.srs_cards.map((c) => [c.itemId, c]));
  const words = db.vocabulary
    .map((w) => ({ w, s: effectiveStatus(w, cards.get(w.id)), c: cards.get(w.id) }))
    .filter((x) => (filter === "all" || x.s === filter) && (!q || `${x.w.german} ${x.w.albanian}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => a.w.german.localeCompare(b.w.german));

  function setStatus(w: VocabWord, status: VocabStatus) {
    const card = cards.get(w.id) ?? newCard("vocab", w.id);
    void commit({ vocabulary: [{ ...w, status, statusManual: true }], srs_cards: [applyManualStatus(card, status)] });
  }

  return (
    <Card className="p-0">
      <div className="flex flex-wrap gap-2 border-b border-border p-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kërko…" className="h-9 flex-1 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-accent" />
        <select value={filter} onChange={(e) => setFilter(e.target.value as VocabStatus | "all")} className="h-9 rounded-lg border border-border bg-surface px-2 text-sm">
          <option value="all">Të gjitha</option>
          {VOCAB_STATUSES.map((s) => <option key={s} value={s}>{STATUS_SQ[s]}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="px-4 py-2 font-medium">Deutsch</th>
              <th className="px-2 py-2 font-medium">Shqip</th>
              <th className="px-2 py-2 font-medium">Plural</th>
              <th className="px-2 py-2 font-medium">Niveli</th>
              <th className="px-2 py-2 font-medium">Statusi</th>
              <th className="px-2 py-2 font-medium">Përsëritja e fundit</th>
              <th className="px-2 py-2 font-medium">Saktësia</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {words.map(({ w, s, c }) => (
              <tr key={w.id} className="border-b border-border/60 align-top">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1"><span className="de text-[15px] font-medium">{displayWord(w)}</span><SpeakButton text={displayWord(w)} className="h-6 w-6" /></div>
                  <p className="de text-xs text-muted">{w.example}</p>
                </td>
                <td className="px-2 py-2.5">{w.albanian}</td>
                <td className="de px-2 py-2.5 text-muted">{w.plural ?? "–"}</td>
                <td className="px-2 py-2.5"><Badge>{w.level}</Badge></td>
                <td className="px-2 py-2.5">
                  <select value={s} onChange={(e) => setStatus(w, e.target.value as VocabStatus)} className={`rounded-md border border-border bg-surface px-1.5 py-1 text-xs`} title={w.statusManual ? "Vendosur manualisht" : "Llogaritur nga përsëritjet"}>
                    {VOCAB_STATUSES.map((x) => <option key={x} value={x}>{STATUS_SQ[x]}</option>)}
                  </select>
                  <div className="mt-1"><Badge tone={STATUS_TONE[s]}>{w.statusManual ? "manual" : "auto"}</Badge></div>
                </td>
                <td className="px-2 py-2.5 text-xs text-muted">{c?.lastReviewedAt?.slice(0, 10) ?? "asnjëherë"}<br />{c && `tjetra: ${c.dueAt.slice(0, 10)}`}</td>
                <td className="px-2 py-2.5 text-xs tabular-nums">{c?.totalReviews ? `${Math.round((c.totalCorrect / c.totalReviews) * 100)}% (${c.totalReviews})` : "–"}</td>
                <td className="px-4 py-2.5 text-right">
                  <button type="button" className="text-xs text-muted hover:text-bad" onClick={() => { if (confirm(`Fshi "${w.german}"?`)) { void remove("vocabulary", [w.id]); void remove("srs_cards", [`vocab:${w.id}`]); } }}>
                    Fshi
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!words.length && <p className="p-6 text-center text-sm text-muted">Asnjë fjalë.</p>}
      </div>
    </Card>
  );
}

function AddWord({ onAdded }: { onAdded: () => void }) {
  const { db, commit } = useData();
  const [f, setF] = useState({ german: "", albanian: "", article: "" as "" | "der" | "die" | "das", plural: "", example: "", exampleSq: "", level: "A1" as CEFR });
  const exists = db.vocabulary.some((w) => w.german.toLowerCase() === f.german.trim().toLowerCase());
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  function save() {
    const word: VocabWord = {
      id: uid(),
      german: f.german.trim(),
      albanian: f.albanian.trim(),
      article: f.article || null,
      plural: f.plural.trim() || null,
      partOfSpeech: f.article ? "noun" : "other",
      example: f.example.trim(),
      exampleSq: f.exampleSq.trim(),
      level: f.level,
      difficulty: 2,
      tags: ["manual"],
      status: "new",
      statusManual: false,
      source: "manual",
      createdAt: nowIso(),
    };
    void commit({ vocabulary: [word], srs_cards: [newCard("vocab", word.id)] });
    onAdded();
  }
  const input = "h-10 w-full rounded-lg border border-border bg-surface px-3 outline-none focus:border-accent";
  return (
    <Card className="max-w-2xl">
      <CardTitle sub="Fjalët nga bisedat me mentorin mund t'i shtosh edhe me një klik gjatë bisedës.">Shto një fjalë</CardTitle>
      <div className="grid gap-3 sm:grid-cols-[100px_1fr]">
        <select value={f.article} onChange={set("article")} className={input}>
          <option value="">–</option><option>der</option><option>die</option><option>das</option>
        </select>
        <input value={f.german} onChange={set("german")} placeholder="Deutsch (p.sh. Rechnung)" className={`${input} de`} />
        <span className="text-sm text-muted sm:self-center">Shqip</span>
        <input value={f.albanian} onChange={set("albanian")} placeholder="p.sh. fatura" className={input} />
        <span className="text-sm text-muted sm:self-center">Plural</span>
        <input value={f.plural} onChange={set("plural")} placeholder="die Rechnungen" className={`${input} de`} />
        <span className="text-sm text-muted sm:self-center">Shembull</span>
        <input value={f.example} onChange={set("example")} placeholder="Die Rechnung ist falsch." className={`${input} de`} />
        <span className="text-sm text-muted sm:self-center">Përkthimi</span>
        <input value={f.exampleSq} onChange={set("exampleSq")} placeholder="Fatura është e gabuar." className={input} />
        <span className="text-sm text-muted sm:self-center">Niveli</span>
        <select value={f.level} onChange={set("level")} className={input}>
          {["A1", "A2", "B1", "B2"].map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>
      {exists && <p className="mt-3 text-sm text-warn">Kjo fjalë ekziston tashmë në fjalor.</p>}
      <div className="mt-4 flex justify-end">
        <Button disabled={!f.german.trim() || !f.albanian.trim() || exists} onClick={save}>Ruaj</Button>
      </div>
    </Card>
  );
}
