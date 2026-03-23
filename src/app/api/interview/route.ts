import { streamText } from "ai";
import { createModel } from "@/lib/ai/provider";
import { buildInterviewSystemPrompt } from "@/lib/ai/prompts";

export async function POST(req: Request) {
  const { messages, persona, apiKey, baseUrl, modelId } = await req.json();

  const result = streamText({
    model: createModel(apiKey, baseUrl, modelId),
    system: buildInterviewSystemPrompt(persona),
    messages,
    temperature: 0.8,
  });

  return result.toTextStreamResponse();
}
