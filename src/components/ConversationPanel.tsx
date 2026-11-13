"use client";

import { useEffect, useRef, useState } from "react";
import { SpeakButton } from "@/components/ExerciseRunner";
import { Icon } from "@/components/icons";
import { useData } from "@/components/providers/DataProvider";
import { Badge, Button, Card, Notice, Spinner, Sq } from "@/components/ui";
import { ai } from "@/lib/ai/client";
import type { ConverseResponse, Evaluation } from "@/lib/ai/schemas";
import { compareSpoken } from "@/lib/answer-check";
import { mergeChanges } from "@/lib/db/changes";
import { makeSession } from "@/lib/learning";
import { buildMentorContext } from "@/lib/memory";
import { CATEGORY_LABEL, recordCorrections } from "@/lib/mistakes";
import { newCard } from "@/lib/srs";
import { speak, stopSpeaking, useSpeechRecognition } from "@/lib/speech";
import type { CEFR, ChatMessage, Conversation, MentorMemory, SessionType, SkillEvidence, VocabWord } from "@/lib/types";
import { cn, nowIso, uid } from "@/lib/utils";

type Mode = Conversation["mode"];

export interface ScriptStep {
  prompt: string;
  promptSq: string;
  model: string;
  expect?: string[][];
  hintSq?: string;
}

export interface ConversationResult {
  turns: number;
  avgScore: number | null;
  evaluation: Evaluation | null;
  conversation: Conversation;
}

const SESSION_TYPE: Record<Mode, SessionType> = {
  mentor: "mentor",
  speaking: "speaking",
  callcenter: "callcenter",
  placement: "placement",
  daily: "daily",
  assessment: "assessment",
};

export function ConversationPanel({
  mode,
  scenarioId,
  title,
  level,
  scenario,
  opening,
  script,
  maxTurns,
  evaluate = false,
  goals,
  onEnd,
  autoAudioDefault = true,
  recordSession = true,
  injected,
}: {
  mode: Mode;
  scenarioId: string;
  title: string;
  level: CEFR;
  scenario: { title: string; context: string; level: string; goals?: { id: string; de: string }[] } | null;
  opening?: { german: string; albanian: string };
  script?: ScriptStep[];
  maxTurns?: number;
  evaluate?: boolean;
  goals?: { id: string; de: string; sq: string }[];
  onEnd?: (r: ConversationResult) => void;
  autoAudioDefault?: boolean;
  recordSession?: boolean;
  /** Send a message programmatically (e.g. quick prompts). Change `id` to send again. */
  injected?: { text: string; id: number };
}) {
  const { db, commit, ai: aiStatus, profile } = useData();
  const useAi = Boolean(aiStatus?.available);
  const startedAt = useRef(nowIso());
  const convId = useRef(uid());
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    opening ? [{ role: "assistant", content: opening.german, translation: opening.albanian, at: nowIso() }] : [],
  );
  const [pendingReply, setPendingReply] = useState<ConverseResponse | null>(null);
  const [repeatTarget, setRepeatTarget] = useState<string | null>(null);
  const [repeatResult, setRepeatResult] = useState<{ words: { word: string; ok: boolean }[]; similarity: number } | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [autoAudio, setAutoAudio] = useState(autoAudioDefault && mode !== "mentor");
  const [suggestions, setSuggestions] = useState<ConverseResponse["vocabulary"]>([]);
  const [scores, setScores] = useState<number[]>([]);
  const [ended, setEnded] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [scriptIdx, setScriptIdx] = useState(0);
  const [scriptFeedback, setScriptFeedback] = useState<{ model: string; matched?: number; total?: number; hintSq?: string } | null>(null);
  const endedRef = useRef(false);
  const latest = useRef({ messages, scores, db });
  latest.current = { messages, scores, db };
  const sr = useSpeechRecognition();
  const lastInput = useRef<"voice" | "text">("text");
  const bottomRef = useRef<HTMLDivElement>(null);
  const offline = !useAi && Boolean(script?.length);

  const userTurns = messages.filter((m) => m.role === "user").length;
  const limitReached = maxTurns !== undefined && userTurns >= maxTurns;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, pendingReply, repeatTarget, scriptFeedback]);

  // Offline: show the first scripted prompt
  useEffect(() => {
    if (offline && !messages.length && script?.[0]) {
      setMessages([{ role: "assistant", content: script[0].prompt, translation: script[0].promptSq, at: nowIso() }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offline]);

  // AI: if there is no opening message, ask the AI to start
  useEffect(() => {
    if (useAi && !messages.length && !opening) void send("", true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useAi]);

  useEffect(() => {
    if (injected?.text && !busy) void send(injected.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [injected?.id]);

  // play new assistant messages
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  useEffect(() => {
    if (autoAudio && lastAssistant) speak(lastAssistant.content, { rate: profile.ttsRate });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAssistant?.at]);

  // voice input: when recording stops, use the transcript
  useEffect(() => {
    if (!sr.listening && sr.transcript) {
      lastInput.current = "voice";
      if (repeatTarget) checkRepeat(sr.transcript);
      else setInput(sr.transcript);
      sr.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sr.listening]);

  // save the session if the learner leaves mid-conversation
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (!endedRef.current && recordSession) {
        const { messages: msgs, scores: sc } = latest.current;
        if (msgs.some((m) => m.role === "user")) {
          void commit({
            learning_sessions: [makeSession(SESSION_TYPE[mode], startedAt.current, sc.map((s) => ({ score: s })), { summary: title, details: { scenarioId, conversationId: convId.current } })],
          });
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(msgs: ChatMessage[], extra: Partial<Conversation> = {}) {
    const conv: Conversation = {
      id: convId.current,
      mode,
      scenarioId,
      title,
      startedAt: startedAt.current,
      updatedAt: nowIso(),
      messages: msgs,
      summary: "",
      evaluation: null,
      ...extra,
    };
    void commit({ conversations: [conv] });
    return conv;
  }

  function evidence(score: number, itemId: string, skill: SkillEvidence["skill"] = "speaking"): SkillEvidence {
    return { id: uid(), skill, level, itemId, topicId: "", score, at: nowIso(), source: SESSION_TYPE[mode] };
  }

  async function send(text: string, initial = false) {
    const content = text.trim();
    if (!initial && !content) return;
    setErr(null);
    stopSpeaking();
    const method = lastInput.current;
    lastInput.current = "text";
    const userMsg: ChatMessage | null = initial ? null : { role: "user", content, at: nowIso(), inputMethod: method };
    const msgs = userMsg ? [...messages, userMsg] : messages;
    setMessages(msgs);
    setInput("");

    if (offline) return scriptAnswer(content, msgs);

    setBusy(true);
    try {
      const res = await ai.converse({
        mode,
        context: buildMentorContext(db),
        scenario,
        history: msgs.map((m) => ({ role: m.role, content: m.content })),
        inputMethod: method,
      });
      let updated = msgs;
      if (userMsg) {
        const analysed: ChatMessage = {
          ...userMsg,
          corrections: res.analysis.corrections,
          feedbackSq: res.analysis.feedbackSq,
          isCorrect: res.analysis.isCorrect && res.analysis.corrections.length === 0,
        };
        updated = [...msgs.slice(0, -1), analysed];
        setMessages(updated);
        const mistakes = recordCorrections(db, res.analysis.corrections, SESSION_TYPE[mode]);
        const notes: MentorMemory[] = res.memoryNotes.slice(0, 2).map((n) => ({ id: uid(), kind: "observation", content: n, topicId: "", importance: 2, createdAt: nowIso() }));
        const score = Math.max(0, Math.min(1, res.turnScore));
        setScores((s) => [...s, score]);
        void commit(mergeChanges({ mistakes, mentor_memory: notes, skill_evidence: [evidence(score, `${scenarioId}:turn`)] }));
      }
      const known = new Set(db.vocabulary.map((w) => w.german.toLowerCase()));
      setSuggestions(res.vocabulary.filter((v) => v.german && !known.has(v.german.toLowerCase())));
      if (userMsg && res.repeatSentence && res.analysis.corrections.length) {
        setRepeatTarget(res.repeatSentence);
        setRepeatResult(null);
        setPendingReply(res);
        persist(updated);
      } else {
        revealReply(res, updated);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "AI error");
    } finally {
      setBusy(false);
    }
  }

  function revealReply(res: ConverseResponse, base: ChatMessage[]) {
    const next: ChatMessage[] = [...base, { role: "assistant", content: res.reply.german, translation: res.reply.albanian, at: nowIso() }];
    setMessages(next);
    setPendingReply(null);
    setRepeatTarget(null);
    persist(next);
    if (res.endConversation && mode === "callcenter") void end(next);
  }

  function checkRepeat(spoken: string) {
    if (!repeatTarget) return;
    const r = compareSpoken(spoken, repeatTarget);
    setRepeatResult(r);
    void commit({ skill_evidence: [evidence(r.similarity >= 0.85 ? 1 : r.similarity, `${scenarioId}:repeat`)] });
  }

  function scriptAnswer(answer: string, msgs: ChatMessage[]) {
    const step = script![scriptIdx];
    let matched: number | undefined;
    let total: number | undefined;
    if (step.expect?.length) {
      const a = answer.toLowerCase();
      total = step.expect.length;
      matched = step.expect.filter((group) => group.some((k) => a.includes(k.toLowerCase()))).length;
      const polite = mode !== "callcenter" || !/\bdu\b|\bdich\b|\bdir\b/i.test(answer);
      const score = (matched / total) * (polite ? 1 : 0.5);
      setScores((s) => [...s, score]);
      void commit({ skill_evidence: [evidence(score, `${scenarioId}:script${scriptIdx}`)] });
    }
    setScriptFeedback({ model: step.model, matched, total, hintSq: step.hintSq });
    persist(msgs);
  }

  function scriptSelfRate(score: number) {
    setScores((s) => [...s, score]);
    void commit({ skill_evidence: [evidence(score, `${scenarioId}:script${scriptIdx}`)] });
    scriptNext();
  }

  function scriptNext() {
    setScriptFeedback(null);
    const nextIdx = scriptIdx + 1;
    if (!script || nextIdx >= script.length || (maxTurns && nextIdx >= maxTurns)) {
      void end(messages);
      return;
    }
    setScriptIdx(nextIdx);
    const next: ChatMessage[] = [...messages, { role: "assistant", content: script[nextIdx].prompt, translation: script[nextIdx].promptSq, at: nowIso() }];
    setMessages(next);
  }

  async function end(msgs = messages) {
    if (endedRef.current) return;
    endedRef.current = true;
    stopSpeaking();
    setEnded(true);
    let ev: Evaluation | null = null;
    const turns = msgs.filter((m) => m.role === "user").length;
    if (evaluate && useAi && turns >= 2 && (mode === "speaking" || mode === "callcenter")) {
      setBusy(true);
      try {
        ev = await ai.evaluateConversation({
          mode,
          context: buildMentorContext(db),
          scenario: { title, goals: goals?.map((g) => ({ id: g.id, de: g.de })) },
          history: msgs.map((m) => ({ role: m.role, content: m.content })),
        });
        setEvaluation(ev);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Evaluation failed");
      } finally {
        setBusy(false);
      }
    }
    const sc = latest.current.scores;
    const avg = sc.length ? sc.reduce((a, b) => a + b, 0) / sc.length : null;
    const conv = persist(msgs, { evaluation: ev as unknown as Record<string, unknown> | null, summary: ev?.summarySq ?? "" });
    if (recordSession && turns > 0) {
      const session = makeSession(SESSION_TYPE[mode], startedAt.current, sc.map((s) => ({ score: s })), {
        summary: title,
        details: { scenarioId, conversationId: convId.current, evaluation: ev },
      });
      void commit({ learning_sessions: [session] });
    }
    onEnd?.({ turns, avgScore: avg, evaluation: ev, conversation: conv });
  }

  function addWord(v: ConverseResponse["vocabulary"][number]) {
    const word: VocabWord = {
      id: uid(),
      german: v.german,
      albanian: v.albanian,
      article: v.article || null,
      plural: v.plural || null,
      partOfSpeech: v.article ? "noun" : "other",
      example: v.example,
      exampleSq: v.exampleSq,
      level,
      difficulty: 2,
      tags: [mode],
      status: "new",
      statusManual: false,
      source: mode === "callcenter" ? "callcenter" : "conversation",
      createdAt: nowIso(),
    };
    void commit({ vocabulary: [word], srs_cards: [newCard("vocab", word.id)] });
    setSuggestions((s) => s.filter((x) => x.german !== v.german));
  }

  if (!useAi && !script?.length) {
    return (
      <Notice tone="warn">
        Kjo pjesë kërkon mentorin AI. Konfiguro një çelës API në server (shiko Settings → AI) ose përdor ushtrimet e tjera, të cilat funksionojnë pa AI.
      </Notice>
    );
  }

  return (
    <div className="space-y-4">
      {!useAi && (
        <Notice tone="info">
          Modaliteti pa AI: pyetjet janë të paracaktuara dhe krahasohen me një përgjigje model. Me AI, mentori analizon çdo fjali dhe të korrigjon.
        </Notice>
      )}
      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{title}</span>
            <Badge>{level}</Badge>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" checked={autoAudio} onChange={(e) => setAutoAudio(e.target.checked)} className="accent-[var(--accent)]" />
            Auto-Audio
          </label>
        </div>

        <div className="max-h-[56vh] min-h-[280px] space-y-4 overflow-y-auto px-5 py-5">
          {messages.map((m, i) => (
            <MessageBubble key={i} m={m} mode={mode} />
          ))}

          {repeatTarget && (
            <div className="rounded-xl border border-accent/40 bg-accent-soft p-4">
              <p className="text-sm font-medium text-accent">Përsërite fjalinë e korrigjuar (me zë ose me shkrim):</p>
              <div className="mt-2 flex items-center gap-1">
                <p className="de text-lg font-medium">{repeatTarget}</p>
                <SpeakButton text={repeatTarget} />
              </div>
              {repeatResult && (
                <div className="mt-3">
                  <p className="de flex flex-wrap gap-1 text-[16px]">
                    {repeatResult.words.map((w, i) => (
                      <span key={i} className={cn("rounded px-1", w.ok ? "bg-good-soft text-good" : "bg-bad-soft text-bad")}>
                        {w.word}
                      </span>
                    ))}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {repeatResult.similarity >= 0.85 ? "Shumë mirë! E përsërite saktë." : "Disa fjalë mungojnë ose nuk u dëgjuan qartë. Provo përsëri ose vazhdo."}
                  </p>
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {sr.supported && (
                  <Button size="sm" variant={sr.listening ? "danger" : "primary"} onClick={() => (sr.listening ? sr.stop() : sr.start())}>
                    <Icon.mic /> {sr.listening ? "Stop" : "Fol"}
                  </Button>
                )}
                <RepeatTyped onSubmit={checkRepeat} />
                <Button size="sm" variant="secondary" onClick={() => pendingReply && revealReply(pendingReply, messages)}>
                  {repeatResult?.similarity && repeatResult.similarity >= 0.85 ? "Vazhdo" : "Kalo"}
                </Button>
              </div>
              {sr.listening && <p className="de mt-2 text-sm text-muted">{sr.transcript} {sr.interim}</p>}
            </div>
          )}

          {scriptFeedback && (
            <div className="rounded-xl border border-border bg-surface-2 p-4 text-sm">
              {scriptFeedback.total !== undefined && (
                <p className="mb-2 font-medium">
                  {scriptFeedback.matched === scriptFeedback.total ? "Mirë! I ke përfshirë pikat kryesore." : `Ke përfshirë ${scriptFeedback.matched}/${scriptFeedback.total} pikat kryesore.`}{" "}
                  {scriptFeedback.hintSq && <span className="font-normal text-muted">{scriptFeedback.hintSq}</span>}
                </p>
              )}
              <p className="text-muted">Përgjigje model:</p>
              <div className="flex items-center gap-1">
                <p className="de text-[16px]">{scriptFeedback.model}</p>
                <SpeakButton text={scriptFeedback.model} />
              </div>
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                {scriptFeedback.total === undefined ? (
                  <>
                    <span className="mr-auto self-center text-xs text-muted">Si ishte përgjigjja jote?</span>
                    <Button size="sm" variant="secondary" onClick={() => scriptSelfRate(0)}>Jo e saktë</Button>
                    <Button size="sm" variant="secondary" onClick={() => scriptSelfRate(0.5)}>Pjesërisht</Button>
                    <Button size="sm" onClick={() => scriptSelfRate(1)}>Saktë</Button>
                  </>
                ) : (
                  <Button size="sm" onClick={scriptNext}>Weiter</Button>
                )}
              </div>
            </div>
          )}

          {busy && (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Spinner /> {ended ? "Vlerësimi…" : "Mentori po mendon…"}
            </div>
          )}
          {err && <Notice tone="bad">{err}</Notice>}
          <div ref={bottomRef} />
        </div>

        {suggestions.length > 0 && !ended && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3 text-sm">
            <span className="text-muted">Fjalë të reja:</span>
            {suggestions.map((v) => (
              <button key={v.german} type="button" onClick={() => addWord(v)} className="rounded-md border border-border px-2 py-1 hover:bg-surface-2" title={v.albanian}>
                + <span className="de">{v.article ? `${v.article} ` : ""}{v.german}</span> <span className="text-muted">({v.albanian})</span>
              </button>
            ))}
          </div>
        )}

        {!ended && (
          <div className="border-t border-border p-4">
            {limitReached ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted">Mjaft për sot në këtë pjesë. 👍</p>
                <Button onClick={() => end()}>Përfundo bisedën</Button>
              </div>
            ) : (
              <div className="flex items-end gap-2">
                {sr.supported && !repeatTarget && (
                  <button
                    type="button"
                    disabled={busy || Boolean(scriptFeedback)}
                    onClick={() => (sr.listening ? sr.stop() : sr.start())}
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-40",
                      sr.listening ? "animate-pulse bg-bad text-white" : "bg-accent text-accent-fg hover:opacity-90",
                    )}
                    aria-label={sr.listening ? "Stop recording" : "Speak"}
                    title={sr.listening ? "Stop" : "Fol në gjermanisht"}
                  >
                    <Icon.mic width={22} height={22} />
                  </button>
                )}
                <textarea
                  value={sr.listening ? `${sr.transcript} ${sr.interim}`.trim() : input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    lastInput.current = "text";
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (!busy && !repeatTarget && !scriptFeedback) void send(input);
                    }
                  }}
                  disabled={busy || Boolean(repeatTarget) || Boolean(scriptFeedback)}
                  rows={1}
                  placeholder={sr.listening ? "Po dëgjoj…" : mode === "callcenter" ? "Përgjigju si punonjës (me 'Sie')…" : "Shkruaj ose fol në gjermanisht…"}
                  className="de max-h-40 min-h-12 flex-1 resize-none rounded-xl border border-border bg-surface px-4 py-3 text-[16px] outline-none focus:border-accent"
                />
                <Button className="h-12" onClick={() => send(input)} disabled={busy || !input.trim() || Boolean(repeatTarget) || Boolean(scriptFeedback)} aria-label="Send">
                  <Icon.send />
                </Button>
              </div>
            )}
            {sr.error && <p className="mt-2 text-xs text-bad">{sr.error}</p>}
            <div className="mt-3 flex items-center justify-between text-xs text-muted">
              <span>{sr.supported ? "Shtyp mikrofonin, fol, pastaj shtyp përsëri për ta ndaluar. Kontrollo tekstin dhe dërgoje." : "Mikrofoni nuk mbështetet në këtë shfletues — shkruaj përgjigjen."}</span>
              {userTurns > 0 && (
                <button type="button" className="underline underline-offset-2 hover:text-text" onClick={() => end()}>
                  Përfundo
                </button>
              )}
            </div>
          </div>
        )}
      </Card>

      {ended && evaluation && <EvaluationCard ev={evaluation} goals={goals} />}
    </div>
  );
}

function RepeatTyped({ onSubmit }: { onSubmit: (t: string) => void }) {
  const [v, setV] = useState("");
  return (
    <form
      className="flex gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim()) onSubmit(v);
      }}
    >
      <input value={v} onChange={(e) => setV(e.target.value)} placeholder="ose shkruaje…" className="de h-8 w-48 rounded-md border border-border bg-surface px-2 text-sm outline-none focus:border-accent" />
      <Button size="sm" variant="secondary" type="submit">OK</Button>
    </form>
  );
}

function MessageBubble({ m, mode }: { m: ChatMessage; mode: Mode }) {
  if (m.role === "assistant") {
    return (
      <div className="flex max-w-[85%] gap-2">
        <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold text-muted">
          {mode === "callcenter" ? "K" : "M"}
        </span>
        <div>
          <div className="flex items-start gap-1 rounded-2xl rounded-tl-sm bg-surface-2 px-4 py-2.5">
            <p className="de whitespace-pre-wrap text-[16px] leading-relaxed">{m.content}</p>
            <SpeakButton text={m.content} className="-mr-2 -mt-1" />
          </div>
          {m.translation && (
            <div className="mt-1 px-1">
              <Sq>{m.translation}</Sq>
            </div>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="ml-auto max-w-[85%]">
      <div
        className={cn(
          "rounded-2xl rounded-tr-sm px-4 py-2.5",
          m.isCorrect === false || (m.corrections && m.corrections.length) ? "bg-bad-soft" : m.isCorrect ? "bg-good-soft" : "bg-accent-soft",
        )}
      >
        <p className="de whitespace-pre-wrap text-[16px]">
          {m.inputMethod === "voice" && <span className="mr-1 text-xs text-muted">🎙</span>}
          {m.content}
        </p>
      </div>
      {m.corrections && m.corrections.length > 0 && (
        <div className="mt-2 space-y-2 rounded-xl border border-border bg-surface p-3 text-sm">
          {m.corrections.map((c, i) => (
            <div key={i}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={c.category === "unnatural" ? "warn" : "bad"}>{CATEGORY_LABEL[c.category]?.sq ?? c.category}</Badge>
                {c.label && <span className="text-xs text-muted">{c.label}</span>}
              </div>
              <p className="de mt-1 text-bad line-through decoration-1">{c.original}</p>
              <p className="de font-medium text-good">{c.corrected}</p>
              <p className="mt-0.5 text-muted">{c.explanationSq}</p>
            </div>
          ))}
          {m.feedbackSq && <p className="border-t border-border pt-2 text-muted">{m.feedbackSq}</p>}
        </div>
      )}
      {m.isCorrect && m.feedbackSq && <p className="mt-1 text-right text-xs text-good">✓ {m.feedbackSq}</p>}
    </div>
  );
}

export function EvaluationCard({ ev, goals }: { ev: Evaluation; goals?: { id: string; de: string; sq: string }[] }) {
  const rows: [string, number][] = [
    ["Gramatika", ev.grammar],
    ["Fjalori", ev.vocabulary],
    ["Rrjedhshmëria", ev.fluency],
    ["Komunikimi profesional", ev.professionalism],
    ["Të kuptuarit", ev.comprehension],
  ];
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Vlerësimi i bisedës</h3>
        <Badge tone="accent">Niveli i demonstruar: {ev.estimatedLevel}</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-5">
        {rows.map(([k, v]) => (
          <div key={k} className="rounded-lg bg-surface-2 p-3">
            <p className="text-xs text-muted">{k}</p>
            <p className="text-xl font-semibold tabular-nums">{Math.round(v)}/10</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm">{ev.summarySq}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-sm font-medium text-good">Çfarë bëre mirë</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">{ev.strengthsSq.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-bad">Çfarë duhet përmirësuar</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">{ev.improveSq.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </div>
      </div>
      {goals?.length ? (
        <div className="mt-4">
          <p className="mb-1 text-sm font-medium">Objektivat e bisedës</p>
          <ul className="space-y-1 text-sm">
            {goals.map((g) => (
              <li key={g.id} className="flex items-center gap-2">
                {ev.goalsAchieved.includes(g.id) ? <Icon.check className="text-good" /> : <Icon.x className="text-bad" />}
                <span>{g.sq}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
