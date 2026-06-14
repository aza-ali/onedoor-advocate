import { NextResponse } from "next/server";
import { transcribeAudio, hasGeminiKey } from "@/lib/gemini";

// Node runtime: Gemini STT runs server-side; GEMINI_API_KEY must never reach the client bundle.
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const audioBase64 = body?.audio_base64;
    const mime = body?.mime;
    if (!audioBase64) {
      return NextResponse.json({ error: "Missing audio_base64." }, { status: 400 });
    }
    if (!hasGeminiKey()) {
      return NextResponse.json(
        { error: "Voice is not available: GEMINI_API_KEY is not set on the server. The text chat still works." },
        { status: 503 },
      );
    }
    return NextResponse.json({ text: await transcribeAudio(audioBase64, mime || "audio/webm") });
  } catch (message) {
    return NextResponse.json({ error: String(message) }, { status: 500 });
  }
}
