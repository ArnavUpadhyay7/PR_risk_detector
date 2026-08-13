import { ChatOpenAI } from "@langchain/openai";
import type { z } from "zod";
import { AppError } from "../../utils/AppError.js";

const DEFAULT_MODEL = "google/gemini-2.0-flash-001";
const DEFAULT_TIMEOUT_MS = 60_000;

type MockHandler = (systemPrompt: string, userPrompt: string) => unknown;

let mockHandler: MockHandler | null = null;

export function setMockLlmHandler(handler: MockHandler | null): void {
  mockHandler = handler;
}

function getApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new AppError(
      "AI analysis is not configured. Set OPENROUTER_API_KEY on the server.",
      503,
    );
  }
  return apiKey;
}

function createClient(): ChatOpenAI {
  return new ChatOpenAI({
    model: process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL,
    apiKey: getApiKey(),
    timeout: DEFAULT_TIMEOUT_MS,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.APP_URL ?? "http://localhost:5000",
        "X-Title": "PR Risk Analyzer",
      },
    },
  });
}

export async function invokeStructured<T extends z.ZodType>(
  schema: T,
  systemPrompt: string,
  userPrompt: string,
): Promise<z.infer<T>> {
  if (mockHandler) {
    const mockResult = mockHandler(systemPrompt, userPrompt);
    return schema.parse(mockResult);
  }

  const llm = createClient();
  const structured = llm.withStructuredOutput(schema, { name: "structured_output" });

  try {
    const result = await structured.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);
    return schema.parse(result);
  } catch (error) {
    console.error("LLM invocation failed:", error);
    throw new AppError(
      "Failed to generate AI risk analysis. Please try again.",
      502,
    );
  }
}
