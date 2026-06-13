import type Anthropic from "@anthropic-ai/sdk";
import { getClient, hasKey, MODEL } from "@/lib/anthropic";
import { TOOLS, runTool } from "@/lib/engine";
import { translateCard, isEnglish, dirFor } from "@/lib/i18n-dynamic";
import type { ChatMessage, ChatStreamEvent, ScreenResult } from "@/lib/types";

// Node runtime: the deterministic engine reads config/rules.json via fs, and the Anthropic key
// must stay server-side. The browser never sees getClient() or the API key.
export const runtime = "nodejs";

const MAX_TOOL_ITERATIONS = 6;

// The model sets the conversation language itself, the moment it learns the person's preference.
const SET_LANGUAGE_TOOL = {
  name: "set_language",
  description:
    "Call this the instant you know the person's preferred language, whether they named it ('I speak Tagalog') or simply wrote in it. It switches the entire interface and the answer card into that language. Provide short translations of the few UI labels so the whole screen matches.",
  input_schema: {
    type: "object",
    required: ["language", "dir", "ui"],
    properties: {
      language: { type: "string", description: "The language name in English, e.g. 'Traditional Chinese', 'Tagalog', 'Arabic', 'Vietnamese'." },
      dir: { type: "string", enum: ["ltr", "rtl"], description: "'rtl' for right-to-left scripts (Arabic, Hebrew, Farsi, Urdu, Pashto, Sindhi), otherwise 'ltr'." },
      ui: {
        type: "object",
        description: "These short interface labels, translated into the language.",
        required: ["placeholder", "checking"],
        properties: {
          placeholder: { type: "string", description: "Translate: 'Type your answer'" },
          checking: { type: "string", description: "Translate: 'Checking your eligibility'" },
          send: { type: "string", description: "Translate: 'Send message'" },
          attach: { type: "string", description: "Translate: 'Attach a document'" },
        },
      },
    },
  },
};

function systemPrompt(language: string, profile: any): string {
  const known = profile?.household
    ? `\n\nKnown household facts already gathered (treat as confirmed, do not re-ask unless contradicted):\n${JSON.stringify(profile.household)}`
    : "";
  const langLine = language && !isEnglish(language)
    ? `The person's chosen language is ${language}. Respond ENTIRELY in ${language}.`
    : `You do not yet know the person's preferred language for certain.`;
  return `You are One Door Advocate, a warm, patient benefits navigator helping California residents understand CalFresh (SNAP) and other state programs. Your job is education and navigation, never an official determination, legal, or medical advice.

LANGUAGE (do this first):
- ${langLine}
- If you have NOT yet confirmed the person's language, your VERY FIRST message must warmly greet them and ask which language they would like to continue in, inviting them to answer in any language or just name one. Keep it to one or two short sentences, and offer the invitation in a couple of common languages so anyone feels welcome.
- The moment you know their language (they named it, or they wrote in it), CALL set_language with that language, the correct text direction, and the translated UI labels. Then continue the ENTIRE conversation in that language. If they switch languages later, call set_language again.

HOW YOU TALK:
- Warm, plain-spoken, encouraging. Short sentences. Gather facts ONE question at a time, never a long list. Ask the single most useful next question, acknowledge the answer, move on.
- Facts you need over time: household size (who buys and prepares food together), monthly income from work, work hours per week, county, monthly rent. Let people share immigration details only if they want to.
- Write PLAIN TEXT only. Never use Markdown: no asterisks, headings, bullet characters, or bracketed links. Just natural sentences in the person's language.

THE RESULT CARD DOES THE HEAVY LIFTING:
- When you call screen_eligibility, the app instantly renders a polished, cited result card right below your message, already translated into the person's language. It shows the verdict, the dollar amount, the reasons why, what to bring, what they will ask, other programs, citations, and the disclaimer.
- So your TEXT reply must be SHORT: one or two warm sentences that hand off to the card ("Good news, here is where you land:"), then optionally one gentle next question. Do NOT restate the dollar amount, the math, the sources, the checklists, or the program list in your text. The card already shows them.

GROUNDING RULES (never break these):
- You NEVER compute eligibility, invent rules, or state a dollar amount or verdict on your own. For ANY verdict or dollar figure, call screen_eligibility and let the card present it. When you decide to screen, call it in the SAME turn; never write "let me check" and stop.
- When explaining WHY a rule applies, call get_rule_citation. For other California programs, call recommend_stack (no dollar figures). Never round, embellish, or change the engine's numbers.
- If you lack enough facts for a meaningful screen, ask for the missing fact instead of guessing.

When you have not run a screen yet, keep replies to a sentence or two and end with one short plain reminder that this is a screening estimate, not an official determination. Once the card is shown, you need not repeat the disclaimer in text; the card carries it.${known}`;
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
  const profile = body?.profile ?? null;
  const enc = new TextEncoder();

  if (!hasKey()) {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(enc.encode(sse({ type: "error", message: "The server is not configured with an Anthropic API key, so the chat advocate is unavailable right now. You can still use the screening form, or ask whoever set up this site to add ANTHROPIC_API_KEY on the server." })));
        controller.enqueue(enc.encode(sse({ type: "done" })));
        controller.close();
      },
    });
    return new Response(stream, { headers: SSE_HEADERS });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatStreamEvent) => controller.enqueue(enc.encode(sse(event)));
      let activeLanguage: string = typeof body?.language === "string" && body.language ? body.language : "English";
      try {
        const client = getClient();
        const messages: Anthropic.MessageParam[] = incoming
          .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
          .map((m) => ({ role: m.role, content: m.content }));

        const tools = [...(TOOLS as unknown as any[]), SET_LANGUAGE_TOOL] as unknown as Anthropic.Tool[];
        let latestScreen: ScreenResult | null = null;
        let latestHousehold: Record<string, any> | null = null;

        for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
          const response = await client.messages.create({
            model: MODEL,
            max_tokens: 2048,
            system: systemPrompt(activeLanguage, profile),
            tools,
            messages,
          });

          const toolUses: Anthropic.ToolUseBlock[] = [];
          for (const block of response.content) {
            if (block.type === "text") { if (block.text) send({ type: "text", delta: block.text }); }
            else if (block.type === "tool_use") toolUses.push(block);
          }
          messages.push({ role: "assistant", content: response.content });
          if (response.stop_reason !== "tool_use" || toolUses.length === 0) break;

          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const tu of toolUses) {
            send({ type: "tool_use", name: tu.name, input: tu.input });
            let result: any;
            if (tu.name === "set_language") {
              const inp = (tu.input as any) || {};
              activeLanguage = inp.language || activeLanguage;
              const dir = inp.dir || dirFor(activeLanguage);
              send({ type: "language", language: activeLanguage, dir, ui: inp.ui || {} });
              result = { ok: true, language: activeLanguage };
            } else {
              try { result = runTool(tu.name, tu.input as any); }
              catch (err: any) { result = { error: String(err?.message || err) }; }
              if (tu.name === "screen_eligibility" && result && !result.error) {
                latestScreen = result as ScreenResult;
                latestHousehold = (tu.input as any)?.household ?? latestHousehold;
              }
            }
            send({ type: "tool_result", name: tu.name, result });
            toolResults.push({ type: "tool_result", tool_use_id: tu.id, content: JSON.stringify(result) });
          }
          messages.push({ role: "user", content: toolResults });
        }

        // Translate the result card into the active language before sending it (numbers verbatim).
        if (latestScreen) {
          let finalResult: ScreenResult = latestScreen;
          if (!isEnglish(activeLanguage)) {
            const card = await translateCard((finalResult as any).presentation, activeLanguage);
            finalResult = { ...(finalResult as any), presentation: card, dir: card.dir };
          }
          send({ type: "result", result: finalResult, household: latestHousehold ?? undefined });
        }
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
