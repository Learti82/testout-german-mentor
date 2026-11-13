"use client";

import { useEffect, useState } from "react";
import { useData } from "@/components/providers/DataProvider";
import { Badge, Button, Notice, Progress, Spinner } from "@/components/ui";
import {
  type EngineSettings,
  type EngineState,
  WEBLLM_MODELS,
  deleteModel,
  isModelCached,
  loadEngineSettings,
  loadWebLLM,
  saveEngineSettings,
  subscribeEngine,
  webgpuSupported,
} from "@/lib/ai/engine";
import { cn } from "@/lib/utils";

const input = "h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-accent";

export function useEngineState(): EngineState {
  const [s, setS] = useState<EngineState>({ phase: "idle", progress: 0, text: "" });
  useEffect(() => subscribeEngine(setS), []);
  return s;
}

export function AiSetup() {
  const { ai, refreshAi } = useData();
  const [cfg, setCfg] = useState<EngineSettings | null>(null);
  const [cached, setCached] = useState<Record<string, boolean>>({});
  const [gpu, setGpu] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const st = useEngineState();

  useEffect(() => {
    setCfg(loadEngineSettings());
    setGpu(webgpuSupported());
    Promise.all(WEBLLM_MODELS.map(async (m) => [m.id, await isModelCached(m.id)] as const)).then((r) => setCached(Object.fromEntries(r)));
  }, [st.phase]);

  if (!cfg) return null;
  const update = (patch: Partial<EngineSettings>) => {
    const next = { ...cfg, ...patch };
    setCfg(next);
    saveEngineSettings(next);
    void refreshAi();
  };

  async function download(id: string) {
    setErr(null);
    update({ kind: "webllm", webllmModel: id });
    try {
      await loadWebLLM(id);
      setCached((c) => ({ ...c, [id]: true }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
    void refreshAi();
  }

  const busy = st.phase === "downloading" || st.phase === "loading";

  return (
    <div className="space-y-5 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={ai?.available ? "good" : "warn"}>{ai?.available ? "aktiv" : "jo aktiv"}</Badge>
        {ai?.available && <span className="text-muted">{ai.provider === "webllm" ? "Në shfletues" : "Ollama"} · {ai.model}</span>}
        {!ai?.available && ai?.reason && <span className="text-muted">{ai.reason}</span>}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {([
          ["webllm", "Në shfletues", "Falas, pa instalim. Modeli shkarkohet një herë dhe ruhet në cache."],
          ["ollama", "Ollama (në kompjuter)", "Falas. Modele më të mëdha = korrigjime më të mira."],
          ["none", "Pa AI", "Ushtrimet, fjalori, gramatika etj. funksionojnë njësoj."],
        ] as const).map(([k, t, d]) => (
          <button
            key={k}
            type="button"
            onClick={() => update({ kind: k })}
            className={cn("rounded-lg border p-3 text-left", cfg.kind === k ? "border-accent bg-accent-soft" : "border-border hover:bg-surface-2")}
          >
            <p className="font-medium">{t}</p>
            <p className="mt-1 text-xs text-muted">{d}</p>
          </button>
        ))}
      </div>

      {cfg.kind === "webllm" && (
        <div className="space-y-3">
          {!gpu && <Notice tone="warn">Ky shfletues nuk mbështet WebGPU. Përdor Google Chrome ose Microsoft Edge (version i ri) në kompjuter — ose zgjidh Ollama.</Notice>}
          {WEBLLM_MODELS.map((m) => {
            const active = cfg.webllmModel === m.id;
            return (
              <div key={m.id} className={cn("rounded-lg border p-3", active ? "border-accent" : "border-border")}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input type="radio" checked={active} onChange={() => update({ webllmModel: m.id })} className="accent-[var(--accent)]" />
                    <span className="font-medium">{m.label}</span>
                    <span className="text-xs text-muted">~{m.sizeGb} GB</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {cached[m.id] ? <Badge tone="good">i shkarkuar</Badge> : null}
                    {cached[m.id] ? (
                      <Button size="sm" variant="ghost" disabled={busy} onClick={async () => { await deleteModel(m.id); setCached((c) => ({ ...c, [m.id]: false })); void refreshAi(); }}>Fshi</Button>
                    ) : (
                      <Button size="sm" disabled={busy || !gpu} onClick={() => download(m.id)}>Shkarko</Button>
                    )}
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted">{m.noteSq}</p>
              </div>
            );
          })}
          {busy && (
            <div className="space-y-1">
              <Progress value={st.progress} />
              <p className="text-xs text-muted">{Math.round(st.progress * 100)}% · {st.text}</p>
            </div>
          )}
          {err && <Notice tone="bad">{err}</Notice>}
          <p className="text-xs text-muted">
            Modeli punon tërësisht në pajisjen tënde (pa internet pas shkarkimit, pa çelës API). Modelet e vogla mund të gabojnë ndonjëherë në korrigjime — për cilësi më të mirë zgjidh 8B ose Ollama.
          </p>
        </div>
      )}

      {cfg.kind === "ollama" && (
        <div className="space-y-3">
          <ol className="list-decimal space-y-1 pl-5 text-muted">
            <li>Instalo Ollama falas nga <span className="text-text">ollama.com</span>.</li>
            <li>Në terminal: <code className="rounded bg-surface-2 px-1">ollama pull {cfg.ollamaModel}</code></li>
            <li>Ollama punon në sfond — kliko "Testo lidhjen".</li>
          </ol>
          <label className="block">
            <span className="mb-1 block text-muted">Adresa</span>
            <input className={input} value={cfg.ollamaUrl} onChange={(e) => setCfg({ ...cfg, ollamaUrl: e.target.value })} onBlur={() => update({})} />
          </label>
          <label className="block">
            <span className="mb-1 block text-muted">Modeli (p.sh. qwen2.5:7b, llama3.1:8b, gemma2:9b)</span>
            <input className={input} value={cfg.ollamaModel} onChange={(e) => setCfg({ ...cfg, ollamaModel: e.target.value })} onBlur={() => update({})} />
          </label>
          <Button size="sm" variant="secondary" disabled={testing} onClick={async () => { setTesting(true); await refreshAi(); setTesting(false); }}>
            {testing ? <Spinner /> : null} Testo lidhjen
          </Button>
          <p className="text-xs text-muted">Nëse aplikacioni nuk hapet nga localhost, nise Ollama me <code>OLLAMA_ORIGINS=*</code>.</p>
        </div>
      )}

      {cfg.kind !== "none" && (
        <label className="flex items-start gap-2">
          <input type="checkbox" className="mt-1 accent-[var(--accent)]" checked={cfg.generateExercises} onChange={(e) => update({ generateExercises: e.target.checked })} />
          <span>
            Krijo edhe ushtrime të reja me AI
            <span className="block text-xs text-muted">Më shumë variacion, por më ngadalë. Pa këtë, përdoren ushtrimet e kursit (të zgjedhura sipas gabimeve të tua).</span>
          </span>
        </label>
      )}
    </div>
  );
}

/** Small global indicator while the model downloads/loads/answers. */
export function EngineIndicator() {
  const st = useEngineState();
  if (st.phase !== "downloading" && st.phase !== "loading") return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 rounded-lg border border-border bg-surface p-3 text-xs shadow-lg">
      <p className="mb-1 font-medium">{st.phase === "downloading" ? "Po shkarkohet mentori AI…" : "Po ngarkohet mentori AI…"}</p>
      <Progress value={st.progress} />
      <p className="mt-1 truncate text-muted">{Math.round(st.progress * 100)}% · {st.text}</p>
    </div>
  );
}
