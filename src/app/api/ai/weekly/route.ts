import { generateStructured } from "@/lib/ai/provider";
import { weeklySystem } from "@/lib/ai/prompts";
import { WeeklyRequest } from "@/lib/ai/request-schemas";
import { handle } from "@/lib/ai/route-helper";
import { WeeklyNarrativeSchema } from "@/lib/ai/schemas";

export const maxDuration = 60;

export async function POST(req: Request) {
  return handle(req, WeeklyRequest, async (body) =>
    generateStructured({
      system: weeklySystem(body.context),
      messages: [{ role: "user", content: `Assessment results and weekly data:\n${JSON.stringify(body.results).slice(0, 12000)}` }],
      schema: WeeklyNarrativeSchema,
      effort: "medium",
      modelOverride: body.model,
    }),
  );
}
