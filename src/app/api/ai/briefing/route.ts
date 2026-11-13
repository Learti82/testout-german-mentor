import { generateStructured } from "@/lib/ai/provider";
import { briefingSystem } from "@/lib/ai/prompts";
import { BriefingRequest } from "@/lib/ai/request-schemas";
import { handle } from "@/lib/ai/route-helper";
import { BriefingSchema } from "@/lib/ai/schemas";

export const maxDuration = 60;

export async function POST(req: Request) {
  return handle(req, BriefingRequest, async (body) =>
    generateStructured({
      system: briefingSystem(body.context),
      messages: [{ role: "user", content: `Rules-based analysis for today:\n${JSON.stringify(body.analysis).slice(0, 6000)}` }],
      schema: BriefingSchema,
      effort: "low",
      maxTokens: 3000,
      modelOverride: body.model,
    }),
  );
}
