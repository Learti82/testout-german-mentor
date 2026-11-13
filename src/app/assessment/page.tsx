"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { type ComprehensionText, LISTENING_TEXTS, READING_TEXTS } from "@/content/assessment";
import { GRAMMAR_TOPICS, TOPIC_BY_ID } from "@/content/grammar";
import { QUESTION_STAGES } from "@/content/questions";
import { SPEAKING_SCENARIOS } from "@/content/scenarios";
import { ExerciseRunner } from "@/components/ExerciseRunner";
import { Icon } from "@/components/icons";
import { useData } from "@/components/providers/DataProvider";
import { ReportCard } from "@/components/ReportCard";
import { Button, Card, Notice, PageHeader, Progress, Spinner } from "@/components/ui";
import { ai } from "@/lib/ai/client";
import { compareSpoken } from "@/lib/answer-check";
import { computeStatus, unlockedLevels } from "@/lib/grammar-progress";
import { type ExerciseResult, makeSession } from "@/lib/learning";
import { estimateLevel } from "@/lib/level";
import { buildMentorContext } from "@/lib/memory";
import { groupMistakes } from "@/lib/mistakes";
import { questionStageIndex } from "@/lib/questions-progress";
import { buildStudyPlan } from "@/lib/session-plan";
import { speak, ttsSupported, useSpeechRecognition } from "@/lib/speech";
import { type CEFR, CEFR_LEVELS, type SectionScores, type WeeklyAssessment } from "@/lib/types";
import { daysBetween, nowIso, shuffle, uid, weekStart } from "@/lib/utils";
import { vocabTranslateExercise } from "@/lib/vocab";
import { rankWeaknesses } from "@/lib/weakness";

type Section = keyof SectionScores;
const SECTIONS: { id: Section; label: string; sq: string }[] = [
  { id: "vocabulary", label: "Wortschatz", sq: "Fjalori" },
  { id: "grammar", label: "Grammatik", sq: "Gramatika" },
  { id: "sentences", label: "Sätze bauen", sq: "Ndërtimi i fjalive" },
  { id: "questions", label: "Fragen", sq: "Formimi i pyetjeve" },
  { id: "reading", label: "Lesen", sq: "Leximi" },
  { id: "listening", label: "Hören", sq: "Dëgjimi" },
  { id: "speaking", label: "Sprechen", sq: "Të folurit" },
];

function textFor(texts: ComprehensionText[], working: CEFR): ComprehensionText {
  const idx = CEFR_LEVELS.indexOf(working);
  return [...texts].reverse().find((t) => CEFR_LEVELS.indexOf(t.level) <= idx) ?? texts[0];
}

export default function AssessmentPage() {
  const { db, commit, ai: aiStatus } = useData();
  const router = useRouter();
  const [step, setStep] = useState(-1);
  const [saved, setSaved] = useState<WeeklyAssessment | null>(null);
  const [busy, setBusy] = useState(false);
  const results = useRef<Partial<Record<Section, ExerciseResult[] | number | null>>>({});
  const startedAt = useRef(nowIso());
  const working = estimateLevel(db).working;

  const sets = useMemo(() => {
    const learned = db.vocabulary.filter((w) => db.srs_cards.some((c) => c.itemId === w.id && c.totalReviews > 0));
    const vocab = shuffle(learned.length >= 6 ? learned : db.vocabulary).slice(0, 8).map(vocabTranslateExercise);
    const open = unlockedLevels(db);
    const studied = GRAMMAR_TOPICS.filter((t) => open.includes(t.level) && computeStatus(db, t.id) !== "available");
    const topics = studied.length >= 3 ? studied : GRAMMAR_TOPICS.filter((t) => open.includes(t.level));
    const grammarPool = topics.flatMap((t) => t.test.filter((e) => e.type === "mc" || e.type === "fill"));
    const grammar = shuffle(grammarPool).slice(0, 10);
    const sentencePool = topics.flatMap((t) => [...t.exercises, ...t.test].filter((e) => e.type === "order" || e.type === "translate" || e.type === "transform"));
    const sentences = shuffle(sentencePool.filter((e) => !grammar.includes(e))).slice(0, 5);
    const qi = questionStageIndex(db);
    const questions = shuffle([...QUESTION_STAGES[qi].exercises, ...(qi > 0 ? QUESTION_STAGES[qi - 1].exercises : [])]).slice(0, 5);
    const reading = textFor(READING_TEXTS, working);
    const listening = textFor(LISTENING_TEXTS, working);
    const speakingPrompts = shuffle(SPEAKING_SCENARIOS.filter((s) => CEFR_LEVELS.indexOf(s.level) <= CEFR_LEVELS.indexOf(working))).slice(0, 3).map((s) => s.questions[Math.floor(Math.random() * s.questions.length)]);
    return { vocab, grammar, sentences, questions, reading, listening, speakingPrompts };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function avg(rs: ExerciseResult[] | number | null | undefined): number | null {
    if (rs === null || rs === undefined) return null;
    if (typeof rs === "number") return rs;
    return rs.length ? rs.reduce((a, r) => a + r.score, 0) / rs.length : null;
  }

  function nextStep() {
    if (step + 1 < SECTIONS.length) setStep(step + 1);
    else void finish();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function finish() {
    setBusy(true);
    const scores = Object.fromEntries(SECTIONS.map((s) => [s.id, avg(results.current[s.id])])) as unknown as SectionScores;
    const vals = Object.values(scores).filter((v): v is number => v !== null);
    const overall = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    const prev = [...db.weekly_assessments].sort((a, b) => b.takenAt.localeCompare(a.takenAt))[0];
    const now = new Date();
    const weekEv = db.skill_evidence.filter((e) => daysBetween(e.at, now) <= 7);
    const topicsThisWeek = [...new Set(weekEv.map((e) => e.topicId).filter((t) => TOPIC_BY_ID[t]))];
    const wordsThisWeek = db.vocabulary.filter((w) => w.source !== "seed" && daysBetween(w.createdAt, now) <= 7).length;
    const reviewedWords = new Set(db.srs_cards.filter((c) => c.lastReviewedAt && daysBetween(c.lastReviewedAt, now) <= 7).map((c) => c.itemId)).size;
    const topicAcc = topicsThisWeek.map((t) => {
      const ev = weekEv.filter((e) => e.topicId === t);
      return { t, acc: ev.reduce((a, e) => a + e.score, 0) / ev.length, n: ev.length };
    });
    const strengths = [
      ...SECTIONS.filter((s) => (scores[s.id] ?? 0) >= 0.8).map((s) => `${s.sq}: ${Math.round((scores[s.id] ?? 0) * 100)}%`),
      ...topicAcc.filter((x) => x.n >= 4 && x.acc >= 0.85).map((x) => TOPIC_BY_ID[x.t].titleSq),
    ];
    const struggles = [
      ...SECTIONS.filter((s) => scores[s.id] !== null && (scores[s.id] ?? 1) < 0.6).map((s) => `${s.sq}: ${Math.round((scores[s.id] ?? 0) * 100)}%`),
      ...rankWeaknesses(db).slice(0, 3).filter((w) => w.score > 1).map((w) => `${TOPIC_BY_ID[w.topicId].titleSq} (${w.reasons[0] ?? ""})`),
    ];
    const frequent = groupMistakes(db).filter((g) => g.recent > 0).slice(0, 5).map((g) => ({ label: g.label, count: g.recent }));
    const comparison = prev
      ? `Rezultati i përgjithshëm: ${Math.round(prev.overall * 100)}% → ${Math.round(overall * 100)}% (${overall >= prev.overall ? "+" : ""}${Math.round((overall - prev.overall) * 100)} pikë).`
      : "Ky është vlerësimi i parë javor — java e ardhshme do të krahasohet me këtë.";
    const plan = buildStudyPlan(db);
    const level = estimateLevel(db);
    const report = {
      learned: [
        ...topicsThisWeek.slice(0, 6).map((t) => TOPIC_BY_ID[t].titleSq),
        `${wordsThisWeek} fjalë të reja, ${reviewedWords} fjalë të përsëritura`,
      ],
      strengths,
      struggles,
      frequentMistakes: frequent,
      comparison,
      nextWeekPlan: plan.days.map((d) => `Dita ${d.day}: ${d.focusSq} — ${d.tasks.join(", ")}`),
      narrative: "",
    };
    if (aiStatus?.available) {
      try {
        const n = await ai.weekly({ context: buildMentorContext(db), results: { sectionScores: scores, overall, previous: prev ? { overall: prev.overall, sectionScores: prev.sectionScores } : null, report } });
        report.narrative = n.narrativeSq;
        if (n.strengths.length) report.strengths = n.strengths;
        if (n.struggles.length) report.struggles = n.struggles;
        if (n.nextWeekPlan.length) report.nextWeekPlan = n.nextWeekPlan;
      } catch {
        /* rules-based report */
      }
    }
    const wa: WeeklyAssessment = {
      id: uid(),
      weekStart: weekStart(),
      takenAt: nowIso(),
      sectionScores: scores,
      overall,
      estimatedLevel: level.label,
      report,
      details: { working },
    };
    const allResults = SECTIONS.flatMap((s) => (Array.isArray(results.current[s.id]) ? (results.current[s.id] as ExerciseResult[]) : []));
    await commit({
      weekly_assessments: [wa],
      study_plans: [plan],
      learning_sessions: [makeSession("assessment", startedAt.current, allResults, { summary: "Wochentest", score: overall })],
      mentor_memory: [{ id: uid(), kind: "milestone", content: `Weekly assessment ${wa.weekStart}: overall ${Math.round(overall * 100)}%, level ${level.label}. Struggles: ${struggles.slice(0, 3).join("; ")}`, topicId: "", importance: 3, createdAt: nowIso() }],
    });
    setSaved(wa);
    setBusy(false);
    setStep(SECTIONS.length);
  }

  if (saved) {
    return (
      <div className="space-y-6">
        <PageHeader title="Raporti javor" sq="Ruajtur. Plani i javës së ardhshme u përditësua." />
        <ReportCard r={saved} prev={[...db.weekly_assessments].filter((w) => w.id !== saved.id).sort((a, b) => b.takenAt.localeCompare(a.takenAt))[0]} defaultOpen />
        <Button onClick={() => router.push("/progress")}>Te progresi</Button>
      </div>
    );
  }

  if (step === -1) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader title="Wochentest" sq="Vlerësimi javor — rreth 20–30 minuta, 7 pjesë." />
        <Card className="space-y-3 text-sm">
          <p>Testojmë: fjalorin, gramatikën, ndërtimin e fjalive, pyetjet, leximin, dëgjimin dhe të folurit. Në fund merr një raport me çfarë kupton mirë, çfarë të vështirëson, dhe një plan për javën tjetër.</p>
          <p className="text-muted">Bëje pa ndihmë dhe pa përkthyes — vetëm kështu raporti është i ndershëm.</p>
          <ul className="grid gap-1 sm:grid-cols-2">{SECTIONS.map((s, i) => <li key={s.id}>{i + 1}. {s.sq}</li>)}</ul>
        </Card>
        <Button onClick={() => setStep(0)}>Fillo</Button>
      </div>
    );
  }

  const sec = SECTIONS[step];
  const store = (r: ExerciseResult[] | number | null) => {
    results.current[sec.id] = r;
    nextStep();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={`${step + 1}. ${sec.sq}`} sq={sec.label} />
      <Progress value={step / SECTIONS.length} />
      {busy ? (
        <Card className="flex items-center gap-2 text-muted"><Spinner /> Po krijoj raportin…</Card>
      ) : (
        <>
          {sec.id === "vocabulary" && <ExerciseRunner key="v" exercises={sets.vocab} source="assessment" showSummary={false} onComplete={store} />}
          {sec.id === "grammar" && <ExerciseRunner key="g" exercises={sets.grammar} source="assessment" showSummary={false} onComplete={store} />}
          {sec.id === "sentences" && <ExerciseRunner key="s" exercises={sets.sentences} source="assessment" showSummary={false} onComplete={store} />}
          {sec.id === "questions" && <ExerciseRunner key="q" exercises={sets.questions} source="assessment" showSummary={false} onComplete={store} />}
          {sec.id === "reading" && (
            <div className="space-y-4">
              <Card>
                <p className="mb-2 text-xs uppercase tracking-wide text-muted">{sets.reading.title} · {sets.reading.level}</p>
                <p className="de text-[17px] leading-relaxed">{sets.reading.text}</p>
              </Card>
              <ExerciseRunner key="r" exercises={sets.reading.questions} source="assessment" showSummary={false} onComplete={store} />
            </div>
          )}
          {sec.id === "listening" && <Listening text={sets.listening} onDone={store} />}
          {sec.id === "speaking" && <SpeakingSection prompts={sets.speakingPrompts} onDone={store} />}
          <div className="flex justify-end">
            <button type="button" className="text-xs text-muted underline" onClick={() => store(null)}>Kalo këtë pjesë (nuk vlerësohet)</button>
          </div>
        </>
      )}
    </div>
  );
}

function Listening({ text, onDone }: { text: ComprehensionText; onDone: (r: ExerciseResult[] | null) => void }) {
  const { profile } = useData();
  const [plays, setPlays] = useState(0);
  if (!ttsSupported()) {
    return <Notice tone="warn">Shfletuesi nuk mbështet zërin (text-to-speech). Kjo pjesë kalohet.</Notice>;
  }
  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">{text.title}</p>
          <p className="text-sm text-muted">Dëgjo tekstin (maksimumi 2 herë), pastaj përgjigju. Teksti nuk shfaqet.</p>
        </div>
        <Button disabled={plays >= 2} onClick={() => { speak(text.text, { rate: profile.ttsRate }); setPlays(plays + 1); }}>
          <Icon.play /> Dëgjo ({2 - plays})
        </Button>
      </Card>
      {plays > 0 && <ExerciseRunner exercises={text.questions} source="assessment" showSummary={false} onComplete={onDone} />}
    </div>
  );
}

function SpeakingSection({ prompts, onDone }: { prompts: { de: string; sq: string; model: string }[]; onDone: (score: number | null) => void }) {
  const { db, ai: aiStatus, commit } = useData();
  const sr = useSpeechRecognition();
  const [i, setI] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [checking, setChecking] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const p = prompts[i];
  const useAi = Boolean(aiStatus?.available);

  async function evaluateAnswer(answer: string) {
    if (!answer.trim()) return;
    let score: number;
    if (useAi) {
      setChecking(true);
      try {
        const r = await ai.evaluateAnswer({ context: buildMentorContext(db), prompt: `Spoken answer to the question: "${p.de}"`, modelAnswer: p.model, answer, level: "A2", topicId: "" });
        score = r.verdict === "correct" ? 1 : r.verdict === "almost" ? 0.6 : 0.25;
        setLast(`${r.explanationSq}${r.corrected ? ` → ${r.corrected}` : ""}`);
      } catch {
        score = Math.min(1, compareSpoken(answer, p.model).similarity + 0.3);
        setLast(null);
      } finally {
        setChecking(false);
      }
    } else {
      // offline: content overlap with the model answer + length heuristic (rough)
      const words = answer.trim().split(/\s+/).length;
      score = Math.min(1, compareSpoken(answer, p.model).similarity * 0.7 + Math.min(words / 8, 1) * 0.3);
      setLast(`Përgjigje model: ${p.model}`);
    }
    setScores((s) => [...s, score]);
    void commit({ skill_evidence: [{ id: uid(), skill: "speaking", level: "A2", itemId: `assess-speak:${p.de}`, topicId: "", score, at: nowIso(), source: "assessment" }] });
  }

  useEffect(() => {
    if (!sr.listening && sr.transcript) {
      void evaluateAnswer(sr.transcript);
      sr.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sr.listening]);

  function next() {
    setLast(null);
    setTyped("");
    if (i + 1 < prompts.length) setI(i + 1);
    else {
      const all = scores;
      onDone(all.length ? all.reduce((a, b) => a + b, 0) / all.length : null);
    }
  }

  if (!p) return null;
  return (
    <Card className="space-y-4">
      <p className="text-sm text-muted">Pyetja {i + 1}/{prompts.length} — përgjigju me zë, me 1–3 fjali të plota.</p>
      <div className="flex items-center gap-2">
        <p className="de text-xl">{p.de}</p>
        <button type="button" className="text-muted" onClick={() => speak(p.de)} aria-label="Play"><Icon.speaker /></button>
      </div>
      {last === null && !checking && scores.length === i && (
        <div className="space-y-3">
          {sr.supported ? (
            <div className="flex items-center gap-3">
              <Button variant={sr.listening ? "danger" : "primary"} onClick={() => (sr.listening ? sr.stop() : sr.start())}>
                <Icon.mic /> {sr.listening ? "Stop & dërgo" : "Fol"}
              </Button>
              <span className="de text-sm text-muted">{sr.transcript} {sr.interim}</span>
            </div>
          ) : (
            <Notice tone="warn">Mikrofoni nuk mbështetet — shkruaj përgjigjen.</Notice>
          )}
          <div className="flex gap-2">
            <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="ose shkruaje…" className="de h-10 flex-1 rounded-lg border border-border bg-surface px-3 outline-none focus:border-accent" />
            <Button variant="secondary" disabled={!typed.trim()} onClick={() => evaluateAnswer(typed)}>Dërgo</Button>
          </div>
        </div>
      )}
      {checking && <p className="flex items-center gap-2 text-sm text-muted"><Spinner /> Po vlerësoj…</p>}
      {last !== null && (
        <div className="rounded-lg bg-surface-2 p-3 text-sm">
          <p>{last}</p>
          <div className="mt-3 flex justify-end"><Button size="sm" onClick={next}>Weiter</Button></div>
        </div>
      )}
      {last === null && scores.length > i && <div className="flex justify-end"><Button size="sm" onClick={next}>Weiter</Button></div>}
    </Card>
  );
}

