import "server-only";

export function isDemo() { return process.env.DEMO_MODE !== "false"; }
export function llmMode(): "demo" | "openai" {
  if (process.env.LLM_MODE === "demo") return "demo";
  if (process.env.LLM_MODE === "openai" || process.env.OPENAI_API_KEY?.trim()) return "openai";
  if (!isDemo()) throw new Error("LLM configuration missing");
  return "demo";
}
