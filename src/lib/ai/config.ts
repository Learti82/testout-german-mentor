import "server-only";

export type ProviderKind = "anthropic" | "openai-compatible" | "none";

export interface AiConfig {
  provider: ProviderKind;
  model: string;
  allowModelOverride: boolean;
}

export function aiConfig(): AiConfig {
  const explicit = process.env.AI_PROVIDER as ProviderKind | undefined;
  let provider: ProviderKind = "none";
  if (explicit === "anthropic" && process.env.ANTHROPIC_API_KEY) provider = "anthropic";
  else if (explicit === "openai-compatible" && process.env.OPENAI_COMPATIBLE_BASE_URL) provider = "openai-compatible";
  else if (!explicit && process.env.ANTHROPIC_API_KEY) provider = "anthropic";
  else if (!explicit && process.env.OPENAI_COMPATIBLE_BASE_URL) provider = "openai-compatible";
  const model =
    process.env.AI_MODEL ||
    (provider === "anthropic" ? "claude-opus-5-5" : process.env.OPENAI_COMPATIBLE_MODEL || "gpt-4o-mini");
  return { provider, model, allowModelOverride: process.env.AI_ALLOW_MODEL_OVERRIDE !== "false" };
}

export function resolveModel(cfg: AiConfig, override?: string): string {
  if (override && cfg.allowModelOverride && /^[\w.\-:/@]{2,80}$/.test(override)) return override;
  return cfg.model;
}
