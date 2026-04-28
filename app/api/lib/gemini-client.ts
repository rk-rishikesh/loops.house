import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY is not defined");

export const ai = new GoogleGenAI({ apiKey });

export const MODELS = {
  pro: process.env.GEMINI_PRO_MODEL || "gemini-2.5-pro",
  flash: process.env.GEMINI_FLASH_MODEL || "gemini-2.0-flash",
  embedding: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
} as const;

export type ModelTier = keyof typeof MODELS;
const MAX_429_RETRIES = 2;
const BASE_BACKOFF_MS = 1000;

function isRateLimited(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes('"code": 429') ||
    error.message.includes("RESOURCE_EXHAUSTED") ||
    error.message.includes('"status":"Too Many Requests"')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fallbackModelFor(model: ModelTier): ModelTier | null {
  if (model === "flash") return "pro";
  if (model === "pro") return "flash";
  return null;
}

export async function generateContent(
  model: ModelTier,
  contents: Parameters<typeof ai.models.generateContent>[0]["contents"],
  config?: Record<string, unknown>,
) {
  const response = await ai.models.generateContent({
    model: MODELS[model],
    contents,
    config,
  });
  return response;
}

export async function generateJSON<T = unknown>(
  model: ModelTier,
  prompt: string,
  systemInstruction?: string,
): Promise<T> {
  const response = await ai.models.generateContent({
    model: MODELS[model],
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      temperature: 0.2,
      ...(systemInstruction ? { systemInstruction } : {}),
    },
  });
  if (!response.text) throw new Error("Empty response from Gemini");
  return JSON.parse(response.text) as T;
}

export async function streamContent(
  model: ModelTier,
  contents: Parameters<typeof ai.models.generateContentStream>[0]["contents"],
  config?: Record<string, unknown>,
) {
  let attempt = 0;
  while (attempt <= MAX_429_RETRIES) {
    try {
      const stream = await ai.models.generateContentStream({
        model: MODELS[model],
        contents,
        config,
      });
      return stream;
    } catch (error) {
      if (!isRateLimited(error) || attempt === MAX_429_RETRIES) {
        const fallback = fallbackModelFor(model);
        if (!fallback) throw error;
        const stream = await ai.models.generateContentStream({
          model: MODELS[fallback],
          contents,
          config,
        });
        return stream;
      }
      const jitter = Math.floor(Math.random() * 300);
      const delayMs = BASE_BACKOFF_MS * 2 ** attempt + jitter;
      await sleep(delayMs);
      attempt += 1;
    }
  }

  throw new Error("Failed to start Gemini stream");
}
