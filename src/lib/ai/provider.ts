import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { aiConfig, resolveModel } from "./config";

export type Effort = "low" | "medium" | "high";

export interface GenerateOptions<T extends z.ZodType> {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  schema: T;
  effort?: Effort;
  maxTokens?: number;
  modelOverride?: string;
}

export class AiUnavailableError extends Error {}
export class AiRefusalError extends Error {}

let anthropic: Anthropic | null = null;
function anthropicClient() {
  if (!anthropic) anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 2, timeout: 90_000 });
  return anthropic;
}

/** Anthropic messages must alternate and start with a user turn. */
function normalizeMessages(messages: GenerateOptions<z.ZodType>["messages"]) {
  const out: { role: "user" | "assistant"; content: string }[] = [];
  for (const m of messages) {
    if (!m.content.trim()) continue;
    const last = out.at(-1);
    if (last && last.role === m.role) last.content += "\n\n" + m.content;
    else out.push({ ...m });
  }
  if (!out.length || out[0].role !== "user") out.unshift({ role: "user", content: "(Start)" });
  if (out.at(-1)!.role !== "user") out.push({ role: "user", content: "(Continue)" });
  return out;
}

export async function generateStructured<T extends z.ZodType>(opts: GenerateOptions<T>): Promise<z.infer<T>> {
  const cfg = aiConfig();
  if (cfg.provider === "none") throw new AiUnavailableError("No AI provider configured");
  const model = resolveModel(cfg, opts.modelOverride);
  const messages = normalizeMessages(opts.messages);

  if (cfg.provider === "anthropic") {
    const response = await anthropicClient().beta.messages.parse({
      model,
      max_tokens: opts.maxTokens ?? 8000,
      system: opts.system,
      messages,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { format: betaZodOutputFormat(opts.schema), effort: opts.effort ?? "low" },
    });
    if (response.stop_reason === "refusal") throw new AiRefusalError("The model declined this request.");
    if (response.stop_reason === "max_tokens") throw new Error("The AI response was cut off (max_tokens).");
    if (response.parsed_output == null) throw new Error("The AI response could not be parsed.");
    return response.parsed_output as z.infer<T>;
  }

  // OpenAI-compatible (OpenAI, OpenRouter, Groq, Ollama, LM Studio, ...): JSON mode + schema in the prompt, validated with zod.
  const base = process.env.OPENAI_COMPATIBLE_BASE_URL!.replace(/\/$/, "");
  const schemaJson = JSON.stringify(z.toJSONSchema(opts.schema));
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(process.env.OPENAI_COMPATIBLE_API_KEY ? { authorization: `Bearer ${process.env.OPENAI_COMPATIBLE_API_KEY}` } : {}),
    },
    body: JSON.stringify({
      model,
      max_tokens: opts.maxTokens ?? 4000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: `${opts.system}\n\nRespond ONLY with a JSON object matching this JSON Schema:\n${schemaJson}` },
        ...messages,
      ],
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) throw new Error(`AI provider error ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content ?? "";
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return opts.schema.parse(JSON.parse(json));
}

export function describeError(err: unknown): { status: number; message: string } {
  if (err instanceof AiUnavailableError) return { status: 503, message: "AI is not configured on the server." };
  if (err instanceof AiRefusalError) return { status: 422, message: err.message };
  if (err instanceof Anthropic.AuthenticationError) return { status: 502, message: "AI provider rejected the API key." };
  if (err instanceof Anthropic.RateLimitError) return { status: 429, message: "AI rate limit reached — try again in a moment." };
  if (err instanceof Anthropic.BadRequestError) return { status: 502, message: `AI request rejected: ${err.message}` };
  if (err instanceof Anthropic.APIConnectionError) return { status: 503, message: "Could not reach the AI provider." };
  if (err instanceof Anthropic.APIError) return { status: 502, message: `AI provider error (${err.status}).` };
  if (err instanceof z.ZodError) return { status: 502, message: "AI returned an unexpected format." };
  return { status: 500, message: err instanceof Error ? err.message : "Unknown AI error" };
}
