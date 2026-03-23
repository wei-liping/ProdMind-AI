import { generateText } from "ai";
import { createModel } from "@/lib/ai/provider";
import {
  INSIGHTS_SYSTEM_PROMPT,
  buildInsightsUserPrompt,
} from "@/lib/ai/prompts";

export async function POST(req: Request) {
  const { input, inputType, apiKey, baseUrl, modelId } = await req.json();

  try {
    const { text } = await generateText({
      model: createModel(apiKey, baseUrl, modelId),
      system: INSIGHTS_SYSTEM_PROMPT,
      prompt: buildInsightsUserPrompt(input, inputType),
      temperature: 0.7,
    });

    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const data = JSON.parse(cleaned);

    return Response.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}
