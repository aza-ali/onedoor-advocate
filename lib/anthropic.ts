// SERVER-ONLY Anthropic client factory. The API key is read from process.env on the server and
// NEVER reaches the browser bundle. Do not import this from a client component.
import "server-only";
import Anthropic from "@anthropic-ai/sdk";

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

export function hasKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set on the server (.env.local locally; Secret Manager on Firebase).");
  return new Anthropic({ apiKey });
}
