import { createModel } from "@/lib/ai/provider";
import { generateText } from "ai";

export async function POST(req: Request) {
  const { apiKey, baseUrl, modelId } = await req.json();

  if (!apiKey || !baseUrl || !modelId) {
    return Response.json({ error: "Missing configuration" }, { status: 400 });
  }

  try {
    const { text } = await generateText({
      model: createModel(apiKey, baseUrl, modelId),
      prompt: "Say hi in 5 words or less.",
      maxOutputTokens: 20,
    });

    return Response.json({ ok: true, preview: text.slice(0, 50) });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: msg }, { status: 500 });
  }
}
