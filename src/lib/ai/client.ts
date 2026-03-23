import type { APISettings } from "@/store/settings-store";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callLLM(
  api: APISettings,
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number; stream?: false },
): Promise<string> {
  const res = await fetch(`${api.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${api.apiKey}`,
    },
    body: JSON.stringify({
      model: api.modelId,
      messages,
      temperature: options?.temperature ?? 0.7,
      ...(options?.maxTokens ? { max_tokens: options.maxTokens } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`AI API error (${res.status}): ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function callLLMStream(
  api: APISettings,
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  options?: { temperature?: number },
): Promise<string> {
  const res = await fetch(`${api.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${api.apiKey}`,
    },
    body: JSON.stringify({
      model: api.modelId,
      messages,
      temperature: options?.temperature ?? 0.7,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`AI API error (${res.status}): ${err.slice(0, 200)}`);
  }

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  let full = "";

  if (reader) {
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const payload = trimmed.slice(6);
        if (payload === "[DONE]") break;

        try {
          const json = JSON.parse(payload);
          const content = json.choices?.[0]?.delta?.content;
          if (content) {
            full += content;
            onChunk(full);
          }
        } catch {
          // skip malformed SSE lines
        }
      }
    }
  }

  return full;
}

export async function analyzeInsights(
  api: APISettings,
  input: string,
  inputType: "idea" | "reviews",
) {
  const { INSIGHTS_SYSTEM_PROMPT, buildInsightsUserPrompt } =
    await import("./prompts");

  const text = await callLLM(api, [
    { role: "system", content: INSIGHTS_SYSTEM_PROMPT },
    { role: "user", content: buildInsightsUserPrompt(input, inputType) },
  ]);

  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return JSON.parse(cleaned);
}

export async function generatePRD(
  api: APISettings,
  painPoints: { title: string; description: string }[],
  highFreqNeeds: string[],
  rawInput: string,
) {
  const { PRD_SYSTEM_PROMPT, buildPRDUserPrompt } = await import("./prompts");

  const text = await callLLM(api, [
    { role: "system", content: PRD_SYSTEM_PROMPT },
    {
      role: "user",
      content: buildPRDUserPrompt(painPoints, highFreqNeeds, rawInput),
    },
  ]);

  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return JSON.parse(cleaned);
}

export async function generatePRDDoc(
  api: APISettings,
  personas: { name: string; role: string; bio: string }[],
  scenarios: { title: string; description: string }[],
  features: {
    name: string;
    description: string;
    userStory: string;
    inMVP: boolean;
  }[],
  rawInput: string,
  onChunk: (text: string) => void,
) {
  const { PRD_DOC_SYSTEM_PROMPT } = await import("./prompts");

  const mvp = features.filter((f) => f.inMVP);
  const nonMvp = features.filter((f) => !f.inMVP);

  const prompt = `请基于以下产品信息生成完整 PRD 文档：

## 产品背景
${rawInput}

## 目标用户
${personas.map((p) => `- ${p.name} (${p.role}): ${p.bio}`).join("\n")}

## MVP 功能 (${mvp.length}个)
${mvp.map((f) => `- ${f.name}: ${f.description}\n  User Story: ${f.userStory}`).join("\n")}

## 后续功能 (${nonMvp.length}个)
${nonMvp.map((f) => `- ${f.name}: ${f.description}`).join("\n")}

## 使用场景
${scenarios.map((s) => `- ${s.title}: ${s.description}`).join("\n")}`;

  return callLLMStream(
    api,
    [
      { role: "system", content: PRD_DOC_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    onChunk,
  );
}

export async function generateRICE(
  api: APISettings,
  features: { id: string; name: string; description: string; inMVP: boolean }[],
) {
  const { RICE_SYSTEM_PROMPT, buildRICEUserPrompt } = await import("./prompts");

  const text = await callLLM(
    api,
    [
      { role: "system", content: RICE_SYSTEM_PROMPT },
      { role: "user", content: buildRICEUserPrompt(features) },
    ],
    { temperature: 0.5 },
  );

  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  return JSON.parse(cleaned);
}

export async function streamInterview(
  api: APISettings,
  persona: {
    name: string;
    age: string;
    role: string;
    bio: string;
    goals: string[];
    frustrations: string[];
  },
  messages: { role: string; content: string }[],
  onChunk: (text: string) => void,
) {
  const { buildInterviewSystemPrompt } = await import("./prompts");

  return callLLMStream(
    api,
    [
      { role: "system", content: buildInterviewSystemPrompt(persona) },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ],
    onChunk,
    { temperature: 0.8 },
  );
}

export async function generateProjectName(
  api: APISettings,
  input: string,
): Promise<string> {
  const text = await callLLM(
    api,
    [
      {
        role: "user",
        content: `根据以下产品想法或用户反馈，生成一个 4-8 字的简洁中文项目名称。只返回名称本身，不要引号、标点或任何其他内容。\n\n内容：${input.slice(0, 500)}`,
      },
    ],
    { maxTokens: 30 },
  );

  return text
    .trim()
    .replace(/["""'']/g, "")
    .slice(0, 20);
}

export async function testConnection(api: APISettings): Promise<boolean> {
  try {
    await callLLM(
      api,
      [{ role: "user", content: "Say hi in 5 words or less." }],
      {
        maxTokens: 20,
      },
    );
    return true;
  } catch {
    return false;
  }
}
