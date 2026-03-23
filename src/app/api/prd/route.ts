import { generateText } from "ai";
import { createModel } from "@/lib/ai/provider";
import { PRD_SYSTEM_PROMPT, buildPRDUserPrompt } from "@/lib/ai/prompts";

export async function POST(req: Request) {
  const { painPoints, highFreqNeeds, rawInput, apiKey, baseUrl, modelId } =
    await req.json();

  try {
    const { text } = await generateText({
      model: createModel(apiKey, baseUrl, modelId),
      system: PRD_SYSTEM_PROMPT,
      prompt: buildPRDUserPrompt(painPoints, highFreqNeeds, rawInput),
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
