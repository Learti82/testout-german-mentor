import { generateStructured } from "@/lib/ai/provider";
import { converseSystem } from "@/lib/ai/prompts";
import { ConverseRequest } from "@/lib/ai/request-schemas";
import { handle } from "@/lib/ai/route-helper";
import { ConverseResponseSchema } from "@/lib/ai/schemas";

export const maxDuration = 60;

export async function POST(req: Request) {
  return handle(req, ConverseRequest, async (body) => {
    const history = body.history.slice(-30);
    const last = history.at(-1);
    if (last?.role === "user" && body.inputMethod === "voice") {
      last.content = `${last.content}\n\n[spoken via microphone; the transcript may lack punctuation]`;
    }
    return generateStructured({
      system: converseSystem(body.mode, body.context, body.scenario ? { ...body.scenario, goals: body.scenario.goals?.map((g) => `${g.id}: ${g.de}`) } : null),
      messages: history,
      schema: ConverseResponseSchema,
      effort: "low",
      maxTokens: 4000,
      modelOverride: body.model,
    });
  });
}
