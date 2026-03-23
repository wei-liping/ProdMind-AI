import { generateText } from "ai";
import { createModel } from "@/lib/ai/provider";

export async function POST(req: Request) {
  const { input, apiKey, baseUrl, modelId } = await req.json();

  try {
    const { text } = await generateText({
      model: createModel(apiKey, baseUrl, modelId),
      prompt: `根据以下产品想法或用户反馈，生成一个 4-8 字的简洁中文项目名称。只返回名称本身，不要引号、标点或任何其他内容。

内容：${input.slice(0, 500)}`,
      maxOutputTokens: 30,
      temperature: 0.7,
    });

    const name = text
      .trim()
      .replace(/["""'']/g, "")
      .slice(0, 20);
    return Response.json({ name });
  } catch {
    return Response.json({ name: "" }, { status: 200 });
  }
}
