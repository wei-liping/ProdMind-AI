import { streamText } from "ai";
import { createModel } from "@/lib/ai/provider";
import { PRD_DOC_SYSTEM_PROMPT } from "@/lib/ai/prompts";

export async function POST(req: Request) {
  const { personas, scenarios, features, rawInput, apiKey, baseUrl, modelId } =
    await req.json();

  const mvpFeatures = features.filter((f: { inMVP: boolean }) => f.inMVP);
  const nonMvpFeatures = features.filter((f: { inMVP: boolean }) => !f.inMVP);

  const prompt = `请基于以下产品信息生成完整 PRD 文档：

## 产品背景
${rawInput}

## 目标用户
${personas.map((p: { name: string; role: string; bio: string }) => `- ${p.name} (${p.role}): ${p.bio}`).join("\n")}

## MVP 功能 (${mvpFeatures.length}个)
${mvpFeatures.map((f: { name: string; description: string; userStory: string }) => `- ${f.name}: ${f.description}\n  User Story: ${f.userStory}`).join("\n")}

## 后续功能 (${nonMvpFeatures.length}个)
${nonMvpFeatures.map((f: { name: string; description: string }) => `- ${f.name}: ${f.description}`).join("\n")}

## 使用场景
${scenarios.map((s: { title: string; description: string }) => `- ${s.title}: ${s.description}`).join("\n")}`;

  const result = streamText({
    model: createModel(apiKey, baseUrl, modelId),
    system: PRD_DOC_SYSTEM_PROMPT,
    prompt,
    temperature: 0.7,
  });

  return result.toTextStreamResponse();
}
