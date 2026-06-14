// SERVER-ONLY. Gemini is the VOICE TRANSDUCER ONLY — never the brain.
//   transcribeAudio(): inbound speech -> text (transcription only, no reasoning, no answering)
//   synthesizeSpeech(): Claude's already-written text -> speech (voicing only, verbatim)
// Gemini has NO access to the eligibility engine, makes NO claims, and never identifies itself.
// All reasoning, eligibility math, and citations stay in the Claude tool-use loop (lib/anthropic
// + /api/chat). Two keys, two scopes: ANTHROPIC_API_KEY = the brain; GEMINI_API_KEY = voice I/O.
// The Gemini key's blast radius is limited to STT/TTS; it never touches benefit logic.
import "server-only";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
// Transcription model (audio understanding). TTS model (speech generation). Override via env.
const STT_MODEL = process.env.GEMINI_STT_MODEL || "gemini-2.5-flash";
const TTS_MODEL = process.env.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts";
const TTS_VOICE = process.env.GEMINI_TTS_VOICE || "Kore";

export function hasGeminiKey(): boolean {
  return !!process.env.GEMINI_API_KEY;
}
function key(): string {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error("GEMINI_API_KEY is not set on the server (.env.local locally; Secret Manager on Firebase). Voice is unavailable; the text path still works.");
  return k;
}

// ── STT: speech -> text, transcription ONLY ────────────────────────────────────────────────
// Gemini is instructed to transcribe verbatim and output nothing but the words spoken. It must
// not answer, summarize, paraphrase, or translate-for-meaning. temperature 0 for fidelity.
export async function transcribeAudio(base64: string, mime: string): Promise<string> {
  const res = await fetch(`${GEMINI_BASE}/models/${STT_MODEL}:generateContent?key=${key()}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: "You are a speech-to-text transcriber, not an assistant. Transcribe the audio VERBATIM into text. Output ONLY the exact words spoken, in the language they were spoken. Do not answer questions, do not add commentary, labels, punctuation guesses beyond the obvious, or translation. If the audio is silent or unintelligible, output an empty string." },
            { inline_data: { mime_type: mime || "audio/webm", data: base64 } },
          ],
        },
      ],
      generationConfig: { temperature: 0, maxOutputTokens: 1024 },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Gemini STT failed (${res.status})`);
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((p: any) => p?.text || "").join("").trim();
}

// ── TTS: Claude's text -> speech, voicing ONLY ─────────────────────────────────────────────
// The bytes Claude produced are the bytes spoken. We pass Claude's text as-is; Gemini voices it.
// Gemini 2.5 TTS returns 16-bit mono PCM (default 24kHz); we wrap it in a WAV header so any
// browser <audio> can play it. Returns base64 WAV.
export async function synthesizeSpeech(text: string): Promise<{ audioBase64: string; mime: string }> {
  const res = await fetch(`${GEMINI_BASE}/models/${TTS_MODEL}:generateContent?key=${key()}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: TTS_VOICE } } },
      },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Gemini TTS failed (${res.status})`);
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const inline = parts.map((p: any) => p?.inlineData || p?.inline_data).find((x: any) => x?.data);
  if (!inline?.data) throw new Error("Gemini TTS returned no audio");
  const rate = parseRate(inline.mimeType || inline.mime_type) || 24000;
  const pcm = Buffer.from(inline.data, "base64");
  const wav = pcmToWav(pcm, rate, 1, 16);
  return { audioBase64: wav.toString("base64"), mime: "audio/wav" };
}

// Gemini returns mime like "audio/L16;codec=pcm;rate=24000" — pull the sample rate out.
function parseRate(mime?: string): number | null {
  if (!mime) return null;
  const m = /rate=(\d+)/.exec(mime);
  return m ? parseInt(m[1], 10) : null;
}

function pcmToWav(pcm: Buffer, sampleRate: number, channels: number, bits: number): Buffer {
  const blockAlign = channels * (bits >> 3);
  const byteRate = sampleRate * blockAlign;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bits, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}
