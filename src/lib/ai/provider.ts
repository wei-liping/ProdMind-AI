import { createOpenAI } from "@ai-sdk/openai";

export function createModel(apiKey: string, baseUrl: string, modelId: string) {
  const provider = createOpenAI({ baseURL: baseUrl, apiKey });
  return provider.chat(modelId);
}
