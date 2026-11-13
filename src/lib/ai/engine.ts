"use client";

// Free AI engines that need no API key and no server:
//  - "webllm": a small open model running inside the browser on the GPU (WebGPU). Downloaded once, then cached.
//  - "ollama": a free local model server on the learner's own computer (https://ollama.com).

import { z } from "zod";

export type EngineKind = "none" | "webllm" | "ollama";

export interface EngineSettings {
  kind: EngineKind;
  webllmModel: string;
  ollamaUrl: string;
  ollamaModel: string;
  /** Generate brand-new exercises with the AI (slower on small devices). */
  generateExercises: boolean;
}

export const WEBLLM_MODELS: { id: string; label: string; sizeGb: number; noteSq: string }[] = [
  { id: "Qwen2.5-3B-Instruct-q4f16_1-MLC", label: "Qwen 2.5 · 3B (rekomandohet)", sizeGb: 2.0, noteSq: "Ekuilibër i mirë mes cilësisë dhe shpejtësisë. Kërkon ~2.5 GB memorie grafike." },
  { id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", label: "Qwen 2.5 · 1.5B (i lehtë)", sizeGb: 1.0, noteSq: "Për kompjuterë/laptopë më të dobët. Më i shpejtë, por bën më shumë gabime." },
  { id: "Llama-3.1-8B-Instruct-q4f16_1-MLC", label: "Llama 3.1 · 8B (më i miri)", sizeGb: 4.6, noteSq: "Cilësia më e mirë në gjermanisht. Kërkon ~5 GB memorie grafike (GPU i fortë)." },
];

const SETTINGS_KEY = "german-mentor:ai-engine";
const DEFAULTS: EngineSettings = {
  kind: "none",
  webllmModel: WEBLLM_MODELS[0].id,
  ollamaUrl: "http://localhost:11434",
  ollamaModel: "qwen2.5:7b",
  generateExercises: false,
};

export function loadEngineSettings(): EngineSettings {
  try {
    return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}") as Partial<EngineSettings>) };
  } catch {
    return DEFAULTS;
  }
}

export function saveEngineSettings(s: EngineSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {}
  emit({ ...state });
}

// ---------- progress / state events ----------
export interface EngineState {
  phase: "idle" | "downloading" | "loading" | "ready" | "generating" | "error";
  progress: number;
  text: string;
}
let state: EngineState = { phase: "idle", progress: 0, text: "" };
const listeners = new Set<(s: EngineState) => void>();
function emit(s: EngineState) {
  state = s;
  listeners.forEach((l) => l(s));
}
export function subscribeEngine(fn: (s: EngineState) => void): () => void {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}
export function engineState() {
  return state;
}

export function webgpuSupported(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

// ---------- WebLLM ----------
type WebLLM = typeof import("@mlc-ai/web-llm");
type MLCEngine = Awaited<ReturnType<WebLLM["CreateMLCEngine"]>>;
let webllmMod: WebLLM | null = null;
let engine: MLCEngine | null = null;
let engineModel: string | null = null;
let loading: Promise<MLCEngine> | null = null;

async function lib(): Promise<WebLLM> {
  if (!webllmMod) webllmMod = await import("@mlc-ai/web-llm");
  return webllmMod;
}

export async function isModelCached(modelId: string): Promise<boolean> {
  try {
    return await (await lib()).hasModelInCache(modelId);
  } catch {
    return false;
  }
}

export async function deleteModel(modelId: string) {
  const w = await lib();
  if (engineModel === modelId && engine) {
    await engine.unload();
    engine = null;
    engineModel = null;
  }
  await w.deleteModelAllInfoInCache(modelId);
  emit({ phase: "idle", progress: 0, text: "" });
}

/** Download (first time) and load the model into the GPU. */
export async function loadWebLLM(modelId: string): Promise<MLCEngine> {
  if (engine && engineModel === modelId) return engine;
  if (loading) return loading;
  loading = (async () => {
    if (!webgpuSupported()) throw new Error("Ky shfletues nuk mbështet WebGPU. Përdor Chrome ose Edge të përditësuar në kompjuter.");
    const w = await lib();
    if (engine) await engine.unload();
    const cached = await isModelCached(modelId);
    emit({ phase: cached ? "loading" : "downloading", progress: 0, text: cached ? "Po ngarkohet modeli…" : "Po shkarkohet modeli (vetëm herën e parë)…" });
    const onProgress = (r: { progress: number; text: string }) =>
      emit({ phase: cached ? "loading" : "downloading", progress: r.progress, text: r.text });
    // Runs on the main thread: the heavy work happens asynchronously on the GPU.
    const e = await w.CreateMLCEngine(modelId, { initProgressCallback: onProgress }, { context_window_size: 8192 });
    engine = e;
    engineModel = modelId;
    emit({ phase: "ready", progress: 1, text: "Gati" });
    return e;
  })();
  try {
    return await loading;
  } catch (err) {
    emit({ phase: "error", progress: 0, text: err instanceof Error ? err.message : String(err) });
    throw err;
  } finally {
    loading = null;
  }
}

export function webllmLoaded(): boolean {
  return Boolean(engine);
}

// ---------- availability ----------
export interface AiStatus {
  available: boolean;
  provider: EngineKind;
  model: string;
  /** model is in memory and answers quickly */
  warm: boolean;
  reason?: string;
}

export async function engineStatus(): Promise<AiStatus> {
  const s = loadEngineSettings();
  if (s.kind === "webllm") {
    if (!webgpuSupported()) return { available: false, provider: "webllm", model: s.webllmModel, warm: false, reason: "WebGPU nuk mbështetet në këtë shfletues." };
    const cached = await isModelCached(s.webllmModel);
    return { available: cached, provider: "webllm", model: s.webllmModel, warm: webllmLoaded(), reason: cached ? undefined : "Modeli nuk është shkarkuar ende (Cilësimet)." };
  }
  if (s.kind === "ollama") {
    try {
      const res = await fetch(`${s.ollamaUrl.replace(/\/$/, "")}/api/tags`, { signal: AbortSignal.timeout(2500) });
      const data = (await res.json()) as { models?: { name: string }[] };
      const has = Boolean(data.models?.some((m) => m.name === s.ollamaModel || m.name.startsWith(s.ollamaModel + ":") || m.name === `${s.ollamaModel}:latest`));
      return { available: has, provider: "ollama", model: s.ollamaModel, warm: has, reason: has ? undefined : `Modeli "${s.ollamaModel}" nuk u gjet në Ollama.` };
    } catch {
      return { available: false, provider: "ollama", model: s.ollamaModel, warm: false, reason: "Ollama nuk po përgjigjet në këtë adresë." };
    }
  }
  return { available: false, provider: "none", model: "", warm: false, reason: "Mentori AI nuk është aktivizuar." };
}

// ---------- generation ----------
export class AiError extends Error {}

function jsonSchemaOf(schema: z.ZodType): Record<string, unknown> {
  const js = z.toJSONSchema(schema) as Record<string, unknown>;
  delete js.$schema;
  return js;
}

function parseJson<T extends z.ZodType>(text: string, schema: T): z.infer<T> {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < 0) throw new AiError("Modeli nuk ktheu JSON.");
  const r = schema.safeParse(JSON.parse(text.slice(start, end + 1)));
  if (!r.success) throw new AiError("Modeli ktheu një përgjigje të paplotë. Provo përsëri.");
  return r.data;
}

let queue: Promise<unknown> = Promise.resolve();

export async function generateStructured<T extends z.ZodType>(opts: {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  schema: T;
  maxTokens?: number;
  temperature?: number;
}): Promise<z.infer<T>> {
  const run = async () => {
    const s = loadEngineSettings();
    const msgs = opts.messages.filter((m) => m.content.trim());
    if (!msgs.length || msgs[0].role !== "user") msgs.unshift({ role: "user", content: "(Fillo)" });
    if (msgs.at(-1)!.role !== "user") msgs.push({ role: "user", content: "(Vazhdo)" });
    const schemaJson = jsonSchemaOf(opts.schema);

    if (s.kind === "webllm") {
      const e = await loadWebLLM(s.webllmModel);
      emit({ phase: "generating", progress: 1, text: "Mentori po shkruan…" });
      try {
        const reply = await e.chat.completions.create({
          messages: [{ role: "system", content: opts.system }, ...msgs],
          temperature: opts.temperature ?? 0.3,
          max_tokens: opts.maxTokens ?? 900,
          response_format: { type: "json_object", schema: JSON.stringify(schemaJson) },
        });
        return parseJson(reply.choices[0]?.message?.content ?? "", opts.schema);
      } finally {
        emit({ phase: "ready", progress: 1, text: "Gati" });
      }
    }

    if (s.kind === "ollama") {
      emit({ phase: "generating", progress: 1, text: "Mentori po shkruan…" });
      try {
        const res = await fetch(`${s.ollamaUrl.replace(/\/$/, "")}/api/chat`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            model: s.ollamaModel,
            stream: false,
            format: schemaJson,
            options: { temperature: opts.temperature ?? 0.3, num_predict: opts.maxTokens ?? 900, num_ctx: 8192 },
            messages: [{ role: "system", content: opts.system }, ...msgs],
          }),
        });
        if (!res.ok) throw new AiError(`Ollama: HTTP ${res.status}`);
        const data = (await res.json()) as { message?: { content?: string } };
        return parseJson(data.message?.content ?? "", opts.schema);
      } finally {
        emit({ phase: "idle", progress: 0, text: "" });
      }
    }
    throw new AiError("Mentori AI nuk është aktivizuar. Shko te Cilësimet → Mentori AI falas.");
  };
  const p = queue.then(run, run);
  queue = p.catch(() => {});
  return p as Promise<z.infer<T>>;
}
