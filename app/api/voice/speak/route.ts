import { NextResponse } from "next/server";
import { synthesizeSpeech, hasGeminiKey } from "@/lib/gemini";

// Node runtime: Gemini TTS runs server-side; GEMINI_API_KEY must never reach the client bundle.
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!text) {
      return NextResponse.json({ error: "Missing text to speak." }, { status: 400 });
    }
    if (!hasGeminiKey()) {
      return NextResponse.json(
        { error: "Voice is not available: GEMINI_API_KEY is not set on the server." },
        { status: 503 },
      );
    }
    const { audioBase64, mime } = await synthesizeSpeech(text);
    return NextResponse.json({ audio_base64: audioBase64, mime });
  } catch (message) {
    return NextResponse.json({ error: String(message) }, { status: 500 });
  }
}
