import type Anthropic from "@anthropic-ai/sdk";
import { getClient, hasKey, MODEL } from "@/lib/anthropic";
import { TOOLS, runTool } from "@/lib/engine";
import type { ChatMessage, ChatStreamEvent, ScreenResult } from "@/lib/types";

// Node runtime: the deterministic engine reads config/rules.json via fs, and the Anthropic key
// must stay server-side. The browser never sees getClient() or the API key.
export const runtime = "nodejs";

const MAX_TOOL_ITERATIONS = 6;

type Lang = "en" | "es" | "fa";

const LANG_LABEL: Record<Lang, string> = {
  en: "English",
  es: "Spanish (Español)",
  fa: "Persian/Farsi (فارسی)",
};

function systemPrompt(lang: Lang, profile: any): string {
  const known = profile?.household
    ? `\n\nKnown household facts already gathered (treat as confirmed, do not re-ask unless the user contradicts them):\n${JSON.stringify(
        profile.household
      )}`
    : "";
  return `You are One Door Advocate, a warm, patient benefits navigator helping California residents understand CalFresh (SNAP) and other state programs.

Your job is education and navigation, never an official determination, legal, or medical advice.

HOW YOU TALK:
- Be warm, plain-spoken, and encouraging. Short sentences. No jargon without explaining it.
- Gather household facts conversationally, ONE question at a time. Do not interrogate with a long list. Ask the single most useful next question, acknowledge the answer, then move on.
- Facts you need over time: household size (how many people buy and prepare food together), monthly income from work, who buys and prepares food together, work hours per week, county, monthly rent/shelter cost, and any immigration nuance the person volunteers. Never demand immigration status; let the person share what they are comfortable with.
- Respond in ${LANG_LABEL[lang]}. Keep the entire reply in that language, including the disclaimer.

GROUNDING RULES (critical, never break these):
- You NEVER compute eligibility, invent benefit rules, or state a dollar amount or eligibility verdict on your own.
- For ANY eligibility verdict OR any dollar figure, you MUST call the screen_eligibility tool and present its result. If you have not called it, do not state a verdict or amount.
- When explaining WHY a rule applies, call get_rule_citation and present the cited paragraph and source.
- To suggest OTHER California programs (WIC, Medi-Cal, CalEITC, CARE/FERA, LifeLine, school meals, SUN Bucks), call recommend_stack. These carry no dollar figures.
- Present engine results faithfully, including their citations and as-of date. Do not round, embellish, or change the numbers.
- If you lack enough facts for a meaningful screen, ask for the missing fact instead of guessing. You may screen early with partial facts and explain it is preliminary.

ALWAYS end every reply with this disclaimer, translated into ${LANG_LABEL[lang]}:
"Screening estimate, not an official eligibility determination. This is education and navigation, never an official determination, legal, or medical advice."${known}`;
}

function sse(event: ChatStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

const SSE_HEADERS = {
  "content-type": "text/event-stream; charset=utf-8",
  "cache-control": "no-cache, no-transform",
  connection: "keep-alive",
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const incoming: ChatMessage[] = Array.isArray(body?.messages) ? body.messages : [];
  const lang: Lang = (["en", "es", "fa"] as const).includes(body?.lang) ? body.lang : "en";
  const profile = body?.profile ?? null;

  const enc = new TextEncoder();

  if (!hasKey()) {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          enc.encode(
            sse({
              type: "error",
              message:
                "The server is not configured with an Anthropic API key, so the chat advocate is unavailable right now. You can still use the screening form, or ask whoever set up this site to add ANTHROPIC_API_KEY on the server.",
            })
          )
        );
        controller.enqueue(enc.encode(sse({ type: "done" })));
        controller.close();
      },
    });
    return new Response(stream, { headers: SSE_HEADERS });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatStreamEvent) => controller.enqueue(enc.encode(sse(event)));
      try {
        const client = getClient();

        // Seed the conversation from the chat history (user/assistant text turns).
        const messages: Anthropic.MessageParam[] = incoming
          .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
          .map((m) => ({ role: m.role, content: m.content }));

        const system = systemPrompt(lang, profile);
        let latestScreen: ScreenResult | null = null;

        for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
          const response = await client.messages.create({
            model: MODEL,
            max_tokens: 2048,
            system,
            tools: TOOLS as unknown as Anthropic.Tool[],
            messages,
          });

          // Emit assistant text and collect any tool_use blocks from this turn.
          const toolUses: Anthropic.ToolUseBlock[] = [];
          for (const block of response.content) {
            if (block.type === "text") {
              if (block.text) send({ type: "text", delta: block.text });
            } else if (block.type === "tool_use") {
              toolUses.push(block);
            }
          }

          // Record the assistant turn (full content, so tool_use ids are preserved for the loop).
          messages.push({ role: "assistant", content: response.content });

          if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
            break; // Model is done; no more tools requested.
          }

          // Run each requested tool server-side and feed results back.
          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const tu of toolUses) {
            send({ type: "tool_use", name: tu.name, input: tu.input });
            let result: any;
            try {
              result = runTool(tu.name, tu.input as any);
            } catch (err: any) {
              result = { error: String(err?.message || err) };
            }
            if (tu.name === "screen_eligibility" && result && !result.error) {
              latestScreen = result as ScreenResult;
            }
            send({ type: "tool_result", name: tu.name, result });
            toolResults.push({
              type: "tool_result",
              tool_use_id: tu.id,
              content: JSON.stringify(result),
            });
          }

          messages.push({ role: "user", content: toolResults });
        }

        if (latestScreen) send({ type: "result", result: latestScreen });
        send({ type: "done" });
        controller.close();
      } catch (err: any) {
        send({ type: "error", message: String(err?.message || err || "Chat failed unexpectedly.") });
        send({ type: "done" });
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
