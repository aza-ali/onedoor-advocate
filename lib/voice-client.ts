// lib/voice-client.ts
// CLIENT-side voice helpers. Talks ONLY to our own /api/voice/* routes.
// No server-only imports, no API keys. SSR-safe (guards typeof window).

export interface Recorder {
  start(): Promise<void>;
  stop(): Promise<{ base64: string; mime: string }>;
  cancel(): void;
}

function pickMimeType(): string | undefined {
  if (
    typeof MediaRecorder === "undefined" ||
    typeof MediaRecorder.isTypeSupported !== "function"
  ) {
    return undefined;
  }
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  if (MediaRecorder.isTypeSupported("audio/mp4")) return "audio/mp4";
  return undefined;
}

// Strip the "data:...;base64," prefix from a data URL.
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read audio data"));
    reader.onload = () => {
      const result = String(reader.result || "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(blob);
  });
}

export function createRecorder(): Recorder {
  let recorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let chunks: Blob[] = [];

  function stopTracks(): void {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
  }

  return {
    async start(): Promise<void> {
      if (
        typeof window === "undefined" ||
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== "function" ||
        typeof MediaRecorder === "undefined"
      ) {
        throw new Error("Audio recording is not supported in this browser");
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        throw new Error(
          "Microphone access was denied. Please allow microphone permission and try again."
        );
      }

      chunks = [];
      const mimeType = pickMimeType();
      try {
        recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);
      } catch (err) {
        // Fall back to default if the chosen mimeType was rejected.
        recorder = new MediaRecorder(stream);
      }

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.start();
    },

    stop(): Promise<{ base64: string; mime: string }> {
      return new Promise((resolve, reject) => {
        const rec = recorder;
        if (!rec) {
          stopTracks();
          reject(new Error("Recorder is not running"));
          return;
        }

        rec.onstop = async () => {
          try {
            const mime =
              (chunks[0] && chunks[0].type) || rec.mimeType || "audio/webm";
            const blob = new Blob(chunks, { type: mime });
            const base64 = await blobToBase64(blob);
            resolve({ base64, mime: blob.type || "audio/webm" });
          } catch (err) {
            reject(err instanceof Error ? err : new Error(String(err)));
          } finally {
            recorder = null;
            stopTracks();
          }
        };

        try {
          if (rec.state !== "inactive") rec.stop();
          else rec.onstop?.(new Event("stop") as Event);
        } catch (err) {
          stopTracks();
          recorder = null;
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      });
    },

    cancel(): void {
      const rec = recorder;
      recorder = null;
      chunks = [];
      if (rec) {
        rec.ondataavailable = null;
        rec.onstop = null;
        try {
          if (rec.state !== "inactive") rec.stop();
        } catch {
          // ignore
        }
      }
      stopTracks();
    },
  };
}

export async function transcribe(base64: string, mime: string): Promise<string> {
  const res = await fetch("/api/voice/transcribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audio_base64: base64, mime }),
  });

  if (res.ok) {
    const json = await res.json().catch(() => ({}));
    return json.text || "";
  }

  const json = await res.json().catch(() => ({}));
  if (res.status === 503) {
    throw new Error(json.error || "Voice unavailable");
  }
  throw new Error(json.error || `Transcription failed (${res.status})`);
}

// Module-level ref to the currently playing speech audio so a new speak()
// (or stopSpeaking()) can stop a prior one.
let currentAudio: HTMLAudioElement | null = null;

export function stopSpeaking(): void {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.src = "";
    } catch {
      // ignore
    }
    currentAudio = null;
  }
}

export async function speak(text: string): Promise<void> {
  if (!text.trim()) return;
  if (typeof window === "undefined" || typeof Audio === "undefined") return;

  const res = await fetch("/api/voice/speak", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    if (res.status === 503) {
      throw new Error(json.error || "Voice unavailable");
    }
    throw new Error(json.error || `Speech failed (${res.status})`);
  }

  const json = await res.json().catch(() => ({}));
  const src = `data:${json.mime};base64,${json.audio_base64}`;

  // Stop any prior playback before starting the new one.
  stopSpeaking();

  return new Promise<void>((resolve, reject) => {
    const a = new Audio(src);
    currentAudio = a;

    const cleanup = () => {
      a.onended = null;
      a.onerror = null;
      if (currentAudio === a) currentAudio = null;
    };

    a.onended = () => {
      cleanup();
      resolve();
    };
    a.onerror = () => {
      cleanup();
      reject(new Error("Audio playback failed"));
    };

    a.play().catch((err) => {
      cleanup();
      reject(err instanceof Error ? err : new Error(String(err)));
    });
  });
}
