"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { wordsFor } from "@/content/exercise-builders";
import { Icon } from "@/components/icons";
import { useData } from "@/components/providers/DataProvider";
import { Badge, Button, Card, Progress, Spinner, Sq } from "@/components/ui";
import { ai } from "@/lib/ai/client";
import { type CheckVerdict, checkAnswer, verdictScore } from "@/lib/answer-check";
import { mergeChanges } from "@/lib/db/changes";
import { type ExerciseResult, expectedSentence, recordResults } from "@/lib/learning";
import { srsFromResults } from "@/lib/vocab";
import { buildMentorContext } from "@/lib/memory";
import { speak, useSpeechRecognition } from "@/lib/speech";
import type { Correction, Exercise, SessionType } from "@/lib/types";
import { cn, hashString, nowIso, shuffle } from "@/lib/utils";

const TYPE_LABEL: Record<Exercise["type"], string> = {
  mc: "Zgjidh",
  fill: "Plotëso",
  translate: "Përkthe",
  order: "Rendit",
  transform: "Transformo",
  fix: "Korrigjo",
  free: "Përgjigju lirshëm",
};

interface Feedback {
  verdict: CheckVerdict | "self";
  noteSq: string;
  expected: string;
  explanation: string;
  corrections?: Correction[];
  final: boolean;
}

export function SpeakButton({ text, className }: { text: string; className?: string }) {
  const { profile } = useData();
  return (
    <button
      type="button"
      onClick={() => speak(text, { rate: profile.ttsRate })}
      className={cn("inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-text", className)}
      title="Anhören"
      aria-label="Play audio"
    >
      <Icon.speaker />
    </button>
  );
}

function MicFill({ onText }: { onText: (t: string) => void }) {
  const sr = useSpeechRecognition();
  useEffect(() => {
    if (!sr.listening && sr.transcript) onText(sr.transcript);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sr.listening]);
  if (!sr.supported) return null;
  return (
    <button
      type="button"
      onClick={() => (sr.listening ? sr.stop() : sr.start())}
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border",
        sr.listening ? "bg-bad text-white" : "bg-surface text-muted hover:text-text",
      )}
      title={sr.listening ? "Stop" : "Antworte mit der Stimme"}
      aria-label="Speak answer"
    >
      <Icon.mic />
    </button>
  );
}

const isTyped = (t: Exercise["type"]) => t !== "mc" && t !== "order";
const isGermanPrompt = (e: Exercise) => e.type !== "translate";

export function ExerciseRunner({
  exercises,
  source,
  onComplete,
  finishLabel = "Weiter",
  showSummary = true,
}: {
  exercises: Exercise[];
  source: SessionType | "exercise";
  onComplete?: (results: ExerciseResult[]) => void;
  finishLabel?: string;
  showSummary?: boolean;
}) {
  const { db, commit, ai: aiStatus } = useData();
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [input, setInput] = useState("");
  const [choice, setChoice] = useState<number | null>(null);
  const [picked, setPicked] = useState<number[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [checking, setChecking] = useState(false);
  const [finished, setFinished] = useState(false);
  const recorded = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ex = exercises[index];
  const words = useMemo(() => (ex?.type === "order" ? shuffle(wordsFor(ex), hashString(ex.id)) : []), [ex]);
  const orderText = picked.map((i) => words[i]).join(" ");

  useEffect(() => {
    setInput("");
    setChoice(null);
    setPicked([]);
    setAttempts(0);
    setFeedback(null);
    inputRef.current?.focus();
  }, [index]);

  // record once at the end
  useEffect(() => {
    if (finished && !recorded.current) {
      recorded.current = true;
      void commit(mergeChanges(recordResults(db, results, source), srsFromResults(db, results)));
      if (!showSummary) onComplete?.(results);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  if (!exercises.length) return <p className="text-sm text-muted">Keine Übungen verfügbar.</p>;

  function finishItem(score: number, verdict: Feedback["verdict"], answer: string, corrections?: Correction[]) {
    setResults((r) => [...r, { exercise: ex, answer, score, verdict, corrections, at: nowIso() }]);
  }

  async function check() {
    if (!ex || checking) return;
    if (ex.type === "mc") {
      if (choice === null) return;
      const ok = choice === ex.correctIndex;
      setFeedback({ verdict: ok ? "correct" : "wrong", noteSq: ok ? "Saktë!" : "Jo saktë.", expected: ex.options?.[ex.correctIndex ?? 0] ?? "", explanation: ex.explanation ?? "", final: true });
      finishItem(ok ? 1 : 0, ok ? "correct" : "wrong", ex.options?.[choice] ?? "");
      return;
    }
    const answer = ex.type === "order" ? orderText : input.trim();
    if (!answer) return;

    if (ex.type === "free") {
      if (aiStatus?.available) {
        setChecking(true);
        try {
          const r = await ai.evaluateAnswer({ context: buildMentorContext(db), prompt: ex.prompt, promptSq: ex.promptSq, modelAnswer: ex.answers?.[0], answer, level: ex.level, topicId: ex.topicId });
          const score = r.verdict === "correct" ? 1 : r.verdict === "almost" ? 0.5 : 0;
          setFeedback({ verdict: r.verdict, noteSq: r.explanationSq, expected: r.corrected, explanation: ex.explanation ?? "", corrections: r.corrections, final: true });
          finishItem(score, r.verdict, answer, r.corrections);
        } catch {
          setFeedback({ verdict: "self", noteSq: "Mentori nuk është i disponueshëm. Krahaso vetë me përgjigjen model.", expected: ex.answers?.[0] ?? "", explanation: ex.explanation ?? "", final: true });
        } finally {
          setChecking(false);
        }
      } else {
        setFeedback({ verdict: "self", noteSq: "Krahaso përgjigjen tënde me modelin dhe vlerëso veten me ndershmëri.", expected: ex.answers?.[0] ?? "", explanation: ex.explanation ?? "", final: true });
      }
      return;
    }

    const local = checkAnswer(answer, ex.answers ?? []);
    let verdict: CheckVerdict = local.verdict;
    let noteSq = local.noteSq;
    let corrections: Correction[] | undefined;
    let expected = local.expected;

    // Strict string matching can reject a correct alternative — let the mentor double-check open answers.
    if (verdict !== "correct" && aiStatus?.available && (ex.type === "translate" || ex.type === "transform" || ex.type === "fix")) {
      setChecking(true);
      try {
        const r = await ai.evaluateAnswer({ context: buildMentorContext(db), prompt: ex.prompt, promptSq: ex.promptSq, modelAnswer: ex.answers?.[0], answer, level: ex.level, topicId: ex.topicId });
        if (r.verdict === "correct") {
          verdict = "correct";
          noteSq = "Saktë! (një variant tjetër i saktë)";
          expected = answer;
        } else {
          verdict = r.verdict === "almost" && verdict !== "word_order" ? "almost" : verdict;
          noteSq = r.explanationSq || noteSq;
          corrections = r.corrections;
          expected = r.corrected || expected;
        }
      } catch {
        /* keep local verdict */
      } finally {
        setChecking(false);
      }
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (verdict === "correct") {
      const score = nextAttempts === 1 ? 1 : 0.5;
      setFeedback({ verdict, noteSq: nextAttempts === 1 ? noteSq : "Saktë në provën e dytë.", expected, explanation: ex.explanation ?? "", final: true });
      finishItem(score, verdict, answer);
      return;
    }
    if (nextAttempts === 1) {
      // first miss: give a hint, let the learner find it
      setFeedback({ verdict, noteSq: `${noteSq} Provo edhe një herë.`, expected: "", explanation: ex.explanation ?? "", corrections, final: false });
      return;
    }
    setFeedback({ verdict, noteSq, expected, explanation: ex.explanation ?? "", corrections, final: true });
    finishItem(verdict === "almost" ? 0.25 : verdictScore(verdict) * 0.5, verdict, answer, corrections);
  }

  function selfAssess(ok: boolean) {
    const answer = input.trim();
    finishItem(ok ? 1 : 0, "self", answer);
    next(true);
  }

  function next(skipRecordCheck = false) {
    void skipRecordCheck;
    if (index + 1 < exercises.length) setIndex(index + 1);
    else setFinished(true);
  }

  if (finished) {
    if (!showSummary) return null;
    const score = results.length ? results.reduce((a, r) => a + r.score, 0) / results.length : 0;
    const wrong = results.filter((r) => r.score < 1);
    return (
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">Rezultati</p>
            <p className="text-3xl font-semibold tabular-nums">{Math.round(score * 100)}%</p>
          </div>
          <Badge tone={score >= 0.8 ? "good" : score >= 0.6 ? "warn" : "bad"}>
            {results.filter((r) => r.score >= 1).length}/{results.length} saktë
          </Badge>
        </div>
        {wrong.length > 0 && (
          <div className="mt-5 space-y-3">
            <p className="text-sm font-medium">Për t'u përsëritur</p>
            {wrong.map((r, i) => (
              <div key={i} className="rounded-lg bg-surface-2 p-3 text-sm">
                {r.answer && <p className="de text-bad line-through decoration-1">{r.answer}</p>}
                <p className="de font-medium text-good">{expectedSentence(r.exercise)}</p>
                {r.exercise.explanation && <p className="mt-1 text-muted">{r.exercise.explanation}</p>}
              </div>
            ))}
          </div>
        )}
        <div className="mt-5 flex justify-end">
          <Button data-testid="ex-finish" onClick={() => onComplete?.(results)}>{finishLabel}</Button>
        </div>
      </Card>
    );
  }

  const canCheck = ex.type === "mc" ? choice !== null : ex.type === "order" ? picked.length > 0 : input.trim().length > 0;

  return (
    <Card className="p-0">
      <div className="border-b border-border px-5 py-3">
        <div className="mb-2 flex items-center justify-between text-xs text-muted">
          <span className="flex items-center gap-2">
            <Badge tone="accent">{TYPE_LABEL[ex.type]}</Badge>
            <Badge>{ex.level}</Badge>
          </span>
          <span className="tabular-nums">
            {index + 1} / {exercises.length}
          </span>
        </div>
        <Progress value={index / exercises.length} />
      </div>
      <div className="space-y-4 p-5">
        <div>
          {ex.promptSq && <p className="mb-1 text-sm text-muted">{ex.promptSq}</p>}
          <div className="flex items-start gap-2">
            <p className={cn("text-xl leading-snug", isGermanPrompt(ex) ? "de" : "font-medium")}>{ex.prompt}</p>
            {isGermanPrompt(ex) && <SpeakButton text={ex.prompt.replace(/___/g, "…")} />}
          </div>
        </div>

        {ex.type === "mc" && (
          <div className="grid gap-2 sm:grid-cols-2">
            {ex.options?.map((o, i) => {
              const showRight = feedback && i === ex.correctIndex;
              const showWrong = feedback && i === choice && i !== ex.correctIndex;
              return (
                <button
                  key={i}
                  type="button"
                  data-testid="ex-option"
                  disabled={Boolean(feedback)}
                  onClick={() => setChoice(i)}
                  className={cn(
                    "de rounded-lg border px-4 py-3 text-left text-[17px] transition-colors",
                    showRight ? "border-good bg-good-soft" : showWrong ? "border-bad bg-bad-soft" : choice === i ? "border-accent bg-accent-soft" : "border-border hover:bg-surface-2",
                  )}
                >
                  {o}
                </button>
              );
            })}
          </div>
        )}

        {ex.type === "order" && (
          <div className="space-y-3">
            <div className="de min-h-12 rounded-lg border border-dashed border-border px-3 py-2.5 text-[17px]">
              {picked.length ? (
                <span className="flex flex-wrap gap-1.5">
                  {picked.map((wi, pos) => (
                    <button key={pos} type="button" disabled={Boolean(feedback?.final)} onClick={() => setPicked(picked.filter((_, p) => p !== pos))} className="rounded-md bg-accent-soft px-2 py-1 text-accent">
                      {words[wi]}
                    </button>
                  ))}
                </span>
              ) : (
                <span className="text-sm text-muted">Kliko fjalët me radhë…</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {words.map((w, i) => (
                <button
                  key={i}
                  type="button"
                  data-testid="ex-word"
                  disabled={picked.includes(i) || Boolean(feedback?.final)}
                  onClick={() => {
                    setPicked([...picked, i]);
                    if (feedback && !feedback.final) setFeedback(null);
                  }}
                  className="de rounded-md border border-border bg-surface px-2.5 py-1.5 text-[16px] hover:bg-surface-2 disabled:opacity-30"
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        )}

        {isTyped(ex.type) && (
          <div className="flex gap-2">
            {ex.type === "free" ? (
              <textarea
                data-testid="ex-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={Boolean(feedback?.final)}
                rows={3}
                className="de w-full rounded-lg border border-border bg-surface px-3 py-2 text-[17px] outline-none focus:border-accent"
                placeholder="Schreib auf Deutsch…"
              />
            ) : (
              <input
                ref={inputRef}
                data-testid="ex-input"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (feedback && !feedback.final) setFeedback(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && (feedback?.final ? next() : canCheck && check())}
                disabled={Boolean(feedback?.final)}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                className="de h-11 w-full rounded-lg border border-border bg-surface px-3 text-[17px] outline-none focus:border-accent"
                placeholder={ex.type === "fill" ? "Fjala që mungon…" : "Shkruaj në gjermanisht…"}
              />
            )}
            {!feedback?.final && <MicFill onText={setInput} />}
          </div>
        )}

        {feedback && (
          <div
            className={cn(
              "rounded-lg p-4 text-sm",
              feedback.verdict === "correct" ? "bg-good-soft" : feedback.verdict === "self" ? "bg-info-soft" : feedback.final ? "bg-bad-soft" : "bg-warn-soft",
            )}
          >
            <p className="font-medium">{feedback.noteSq}</p>
            {feedback.final && feedback.verdict !== "correct" && feedback.expected && (
              <div className="mt-2 flex items-center gap-1">
                <p className="de text-[17px] font-medium">{ex.type === "fill" || ex.type === "mc" ? expectedSentence(ex) : feedback.expected}</p>
                <SpeakButton text={ex.type === "fill" || ex.type === "mc" ? expectedSentence(ex) : feedback.expected} />
              </div>
            )}
            {feedback.verdict === "correct" && ex.type !== "mc" && (
              <div className="mt-1 flex items-center gap-1">
                <p className="de">{ex.type === "fill" ? expectedSentence(ex) : feedback.expected}</p>
                <SpeakButton text={ex.type === "fill" ? expectedSentence(ex) : feedback.expected} />
              </div>
            )}
            {feedback.corrections?.map((c, i) => (
              <p key={i} className="mt-2 text-muted">
                <span className="de text-text">{c.corrected}</span> — {c.explanationSq}
              </p>
            ))}
            {feedback.final && feedback.explanation && <p className="mt-2 text-muted">{feedback.explanation}</p>}
            {!feedback.final && feedback.explanation && attempts === 1 && (
              <p className="mt-2 text-muted">Ndihmë: {feedback.explanation}</p>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2">
          {checking && (
            <span className="mr-auto flex items-center gap-2 text-sm text-muted">
              <Spinner /> Mentori po e kontrollon…
            </span>
          )}
          {feedback?.final && feedback.verdict === "self" ? (
            <>
              <Button variant="secondary" data-testid="ex-self-no" onClick={() => selfAssess(false)}>Nuk e dija</Button>
              <Button onClick={() => selfAssess(true)}>E kisha saktë</Button>
            </>
          ) : feedback?.final ? (
            <Button data-testid="ex-next" onClick={() => next()}>{index + 1 < exercises.length ? "Weiter" : "Rezultati"}</Button>
          ) : (
            <>
              {ex.type === "order" && picked.length > 0 && (
                <Button variant="ghost" onClick={() => setPicked([])}>Fshij</Button>
              )}
              <Button data-testid="ex-check" onClick={check} disabled={!canCheck || checking}>
                Kontrollo
              </Button>
            </>
          )}
        </div>
        <Sq className="block text-xs">Sugjerim: shtyp Enter për të kontrolluar. Mund të përgjigjesh edhe me zë (mikrofoni).</Sq>
      </div>
    </Card>
  );
}
