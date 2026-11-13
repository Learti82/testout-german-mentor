import { generateStructured } from "@/lib/ai/provider";
import { generateSystem } from "@/lib/ai/prompts";
import { GenerateRequest } from "@/lib/ai/request-schemas";
import { handle } from "@/lib/ai/route-helper";
import { GeneratedExercisesSchema } from "@/lib/ai/schemas";

export const maxDuration = 60;

export async function POST(req: Request) {
  return handle(req, GenerateRequest, async (body) =>
    generateStructured({
      system: generateSystem(body.context),
      messages: [
        {
          role: "user",
          content: `Create ${body.count} exercises.
Topic: ${body.topicTitle} [${body.topicId}], level ${body.level}.
Types to use: ${body.types.join(", ")}.
Learner's mistakes to target:\n${body.focusMistakes.map((m) => `- ${m}`).join("\n") || "- none"}
Do NOT repeat these existing prompts:\n${body.avoid.map((m) => `- ${m}`).join("\n") || "- none"}`,
        },
      ],
      schema: GeneratedExercisesSchema,
      effort: "medium",
      modelOverride: body.model,
    }),
  );
}
