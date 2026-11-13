import { generateStructured } from "@/lib/ai/provider";
import { planSystem } from "@/lib/ai/prompts";
import { PlanRequest } from "@/lib/ai/request-schemas";
import { handle } from "@/lib/ai/route-helper";
import { PlanSchema } from "@/lib/ai/schemas";

export const maxDuration = 60;

export async function POST(req: Request) {
  return handle(req, PlanRequest, async (body) =>
    generateStructured({
      system: planSystem(body.context),
      messages: [{ role: "user", content: `Results:\n${JSON.stringify(body.results).slice(0, 12000)}` }],
      schema: PlanSchema,
      effort: "medium",
      modelOverride: body.model,
    }),
  );
}
