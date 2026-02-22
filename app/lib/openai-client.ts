import OpenAI from "openai";

export function createOpenAiClient(apiKey: string) {
  return new OpenAI({ apiKey });
}

export function extractJsonObject(text: string) {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Empty OpenAI response");

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    // Fallback for responses that wrap JSON with markdown/code fences.
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace < 0 || lastBrace <= firstBrace) {
      throw new Error("OpenAI response is not valid JSON");
    }
    const candidate = trimmed.slice(firstBrace, lastBrace + 1);
    return JSON.parse(candidate) as unknown;
  }
}
