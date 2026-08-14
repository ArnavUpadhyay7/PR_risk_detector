import { ChatOpenAI } from "@langchain/openai";
import { AppError } from "../../utils/AppError.js";
const DEFAULT_MODEL = "google/gemini-2.0-flash-001";
const DEFAULT_TIMEOUT_MS = 45_000;
const DEFAULT_MAX_TOKENS = 900;
let mockHandler = null;
export function setMockLlmHandler(handler) {
    mockHandler = handler;
}
function getApiKey() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new AppError("AI analysis is not configured. Set OPENROUTER_API_KEY on the server.", 503);
    }
    return apiKey;
}
function getMaxTokens(kind) {
    switch (kind) {
        case "judge":
            return 800;
        case "combined":
            return 2048;
        default:
            return DEFAULT_MAX_TOKENS;
    }
}
function createClient(kind) {
    return new ChatOpenAI({
        model: process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL,
        apiKey: getApiKey(),
        timeout: DEFAULT_TIMEOUT_MS,
        maxTokens: getMaxTokens(kind),
        maxRetries: 0,
        configuration: {
            baseURL: "https://openrouter.ai/api/v1",
            defaultHeaders: {
                "HTTP-Referer": process.env.APP_URL ?? "http://localhost:5000",
                "X-Title": "PR Risk Analyzer",
            },
        },
    });
}
export async function invokeStructured(schema, systemPrompt, userPrompt, kind = "specialist") {
    const result = await invokeStructuredSafe(schema, systemPrompt, userPrompt, kind);
    if (result.data === null) {
        throw new AppError(result.error ?? "Failed to generate AI risk analysis. Please try again.", 502);
    }
    return result.data;
}
export async function invokeStructuredSafe(schema, systemPrompt, userPrompt, kind = "specialist") {
    if (mockHandler) {
        try {
            const mockResult = mockHandler(systemPrompt, userPrompt);
            return { data: schema.parse(mockResult) };
        }
        catch (error) {
            return { data: null, error: error instanceof Error ? error.message : "Mock LLM failed" };
        }
    }
    const llm = createClient(kind);
    const structured = llm.withStructuredOutput(schema, { name: "structured_output" });
    try {
        const result = await structured.invoke([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
        ]);
        return { data: schema.parse(result) };
    }
    catch (error) {
        const message = error instanceof Error && error.message.toLowerCase().includes("timeout")
            ? "AI provider timed out"
            : "AI provider returned an invalid response";
        console.error(`LLM ${kind} invocation failed:`, error instanceof Error ? error.message : error);
        return { data: null, error: message };
    }
}
//# sourceMappingURL=llm.service.js.map