import { generateStructured } from "@/lib/ai/provider";
import { exerciseEvalSystem } from "@/lib/ai/prompts";
import { EvaluateAnswerRequest } from "@/lib/ai/request-schemas";
import { handle } from "@/lib/ai/route-helper";
import { ExerciseEvalSchema } from "@/lib/ai/schemas";

export const maxDuration = 60;

export async function POST(req: Request) {
  return handle(req, EvaluateAnswerRequest, async (body) =>
    generateStructured({
      system: exerciseEvalSystem(body.context),
      messages: [
        {
          role: "user",
          content: `Exercise (level ${body.level}, topic ${body.topicId}): ${body.prompt}${body.promptSq ? `\nAlbanian instruction: ${body.promptSq}` : ""}${body.modelAnswer ? `\nModel answer: ${body.modelAnswer}` : ""}\n\nLearner answer: ${body.answer}`,
        },
      ],
      schema: ExerciseEvalSchema,
      effort: "low",
      maxTokens: 3000,
      modelOverride: body.model,
    }),
  );
}
