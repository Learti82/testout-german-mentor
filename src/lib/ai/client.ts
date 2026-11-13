"use client";

import { getSupabase } from "../supabase";
import type { MentorContext } from "../memory";
import type { Briefing, ConverseResponse, Evaluation, ExerciseEval, GeneratedExercises, PlanResponse, WeeklyNarrative } from "./schemas";

export interface AiStatus {
  available: boolean;
  provider: string;
  model: string;
  allowModelOverride: boolean;
  passcodeRequired: boolean;
  loginRequired: boolean;
}

export const PASSCODE_KEY = "german-mentor:ai-passcode";
export const MODEL_KEY = "german-mentor:ai-model";

export class AiClientError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function headers(): Promise<Record<string, string>> {
  const h: Record<string, string> = { "content-type": "application/json" };
  try {
    const pass = localStorage.getItem(PASSCODE_KEY);
    if (pass) h["x-app-passcode"] = pass;
  } catch {}
  const sb = getSupabase();
  if (sb) {
    const { data } = await sb.auth.getSession();
    if (data.session?.access_token) h.authorization = `Bearer ${data.session.access_token}`;
  }
  return h;
}

function modelOverride(): string | undefined {
  try {
    return localStorage.getItem(MODEL_KEY) || undefined;
  } catch {
    return undefined;
  }
}

async function post<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`/api/ai/${path}`, {
    method: "POST",
    headers: await headers(),
    body: JSON.stringify({ ...body, model: modelOverride() }),
  });
  const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  if (!res.ok) throw new AiClientError((data as { error?: string }).error ?? `HTTP ${res.status}`, res.status);
  return data as T;
}

export async function fetchAiStatus(): Promise<AiStatus> {
  try {
    const res = await fetch("/api/ai/status", { cache: "no-store" });
    return (await res.json()) as AiStatus;
  } catch {
    return { available: false, provider: "none", model: "", allowModelOverride: false, passcodeRequired: false, loginRequired: false };
  }
}

type Msg = { role: "user" | "assistant"; content: string };
type Scenario = { title: string; context: string; level: string; goals?: { id: string; de: string }[] } | null;

export const ai = {
  converse: (b: { mode: string; context: MentorContext; scenario: Scenario; history: Msg[]; inputMethod?: "voice" | "text" }) =>
    post<ConverseResponse>("converse", b),
  evaluateConversation: (b: { mode: "speaking" | "callcenter"; context: MentorContext; scenario: { title: string; goals?: { id: string; de: string }[] }; history: Msg[] }) =>
    post<Evaluation>("evaluate-conversation", b),
  evaluateAnswer: (b: { context: MentorContext; prompt: string; promptSq?: string; modelAnswer?: string; answer: string; level: string; topicId: string }) =>
    post<ExerciseEval>("evaluate-answer", b),
  generate: (b: { context: MentorContext; topicId: string; topicTitle: string; level: string; count: number; types: string[]; focusMistakes: string[]; avoid: string[] }) =>
    post<GeneratedExercises>("generate", b),
  briefing: (b: { context: MentorContext; analysis: unknown }) => post<Briefing>("briefing", b),
  weekly: (b: { context: MentorContext; results: unknown }) => post<WeeklyNarrative>("weekly", b),
  plan: (b: { context: MentorContext; results: unknown }) => post<PlanResponse>("plan", b),
};
