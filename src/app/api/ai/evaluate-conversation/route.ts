import { generateStructured } from "@/lib/ai/provider";
import { evaluationSystem } from "@/lib/ai/prompts";
import { EvaluateConversationRequest } from "@/lib/ai/request-schemas";
import { handle } from "@/lib/ai/route-helper";
import { EvaluationSchema } from "@/lib/ai/schemas";

export const maxDuration = 60;

export async function POST(req: Request) {
  return handle(req, EvaluateConversationRequest, async (body) => {
    const transcript = body.history
      .map((m) => `${m.role === "user" ? (body.mode === "callcenter" ? "EMPLOYEE (learner)" : "LEARNER") : body.mode === "callcenter" ? "CUSTOMER" : "PARTNER"}: ${m.content}`)
      .join("\n");
    return generateStructured({
      system: evaluationSystem(body.mode, body.context, body.scenario),
      messages: [{ role: "user", content: `Transcript:\n${transcript}` }],
      schema: EvaluationSchema,
      effort: "medium",
      modelOverride: body.model,
    });
  });
}
