// Client-safe i18n helper for the chat surface.
// Do NOT import src/server/i18n.mjs here (server-only). This file embeds its own
// small typed dictionary so the chat UI works fully offline; fetchDict() can
// optionally enrich it from GET /api/i18n at runtime.
//
// Source-of-truth strings mirror src/server/i18n.mjs. Farsi (fa) is RTL.

export type Lang = "en" | "es" | "fa";

export interface ChatDict {
  dir: "ltr" | "rtl";
  lang_name: string;
  app_title: string;
  tagline: string;
  send: string;
  placeholder: string;
  attach: string;
  verdict: {
    likely_eligible: string;
    possibly_eligible: string;
    likely_not_eligible: string;
  };
  disclaimer: string;
  talk_navigator: string;
}

export const DIR: Record<Lang, "ltr" | "rtl"> = {
  en: "ltr",
  es: "ltr",
  fa: "rtl",
};

// Embedded dictionary. Must be sufficient to render the chat chrome with no network.
const DICT: Record<Lang, ChatDict> = {
  en: {
    dir: "ltr",
    lang_name: "English",
    app_title: "One Door · California",
    tagline: "One door to every California benefit. Verified, cited, in your language.",
    send: "Send",
    placeholder: "Tell me about your situation",
    attach: "Attach a document",
    verdict: {
      likely_eligible: "Likely eligible",
      possibly_eligible: "Possibly eligible",
      likely_not_eligible: "Likely not eligible",
    },
    disclaimer: "Screening estimate, not an official eligibility determination.",
    talk_navigator: "Apply or talk to a navigator",
  },
  es: {
    dir: "ltr",
    lang_name: "Español",
    app_title: "One Door · California",
    tagline: "Una sola puerta a cada beneficio de California. Verificado, con fuentes, en su idioma.",
    send: "Enviar",
    placeholder: "Cuénteme sobre su situación",
    attach: "Adjuntar un documento",
    verdict: {
      likely_eligible: "Probablemente elegible",
      possibly_eligible: "Posiblemente elegible",
      likely_not_eligible: "Probablemente no elegible",
    },
    disclaimer: "Estimación de evaluación, no una determinación oficial de elegibilidad.",
    talk_navigator: "Solicite o hable con un asesor",
  },
  fa: {
    dir: "rtl",
    lang_name: "فارسی",
    app_title: "One Door · کالیفرنیا",
    tagline: "یک در به همه مزایای کالیفرنیا. تأییدشده، با منبع، به زبان شما.",
    send: "ارسال",
    placeholder: "درباره وضعیت خود به من بگویید",
    attach: "پیوست یک سند",
    verdict: {
      likely_eligible: "به احتمال زیاد واجد شرایط",
      possibly_eligible: "احتمالاً واجد شرایط",
      likely_not_eligible: "به احتمال زیاد واجد شرایط نیست",
    },
    disclaimer: "این یک تخمین غربالگری است، نه تعیین رسمی واجد شرایط بودن.",
    talk_navigator: "درخواست دهید یا با یک راهنما صحبت کنید",
  },
};

// Runtime-enriched overlay from /api/i18n (optional). Merged shallowly over DICT.
let enriched: Partial<Record<Lang, Partial<ChatDict>>> = {};

/**
 * Return the dictionary for a language. Falls back to English for unknown codes.
 * Includes any fields previously merged in by fetchDict().
 */
export function t(lang: Lang): ChatDict {
  const base = DICT[lang] ?? DICT.en;
  const extra = enriched[lang];
  return extra ? { ...base, ...extra } : base;
}

/**
 * Set <html dir> and <html lang> for the chosen language. SSR-guarded.
 * Farsi flips the document to RTL immediately.
 */
export function applyDir(lang: Lang): void {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  el.dir = DIR[lang] ?? "ltr";
  el.lang = lang;
}

/**
 * Optionally enrich the embedded dictionary from GET /api/i18n.
 * Best-effort: on any failure the embedded dict is kept and the app still works.
 * Only overlays keys that exist on ChatDict, so the typed shape is preserved.
 */
export async function fetchDict(): Promise<void> {
  if (typeof fetch === "undefined") return;
  try {
    const res = await fetch("/api/i18n", { headers: { Accept: "application/json" } });
    if (!res.ok) return;
    const data = (await res.json()) as { dict?: Record<string, Record<string, unknown>> };
    if (!data?.dict) return;
    const next: Partial<Record<Lang, Partial<ChatDict>>> = {};
    (Object.keys(DICT) as Lang[]).forEach((lang) => {
      const src = data.dict?.[lang];
      if (!src) return;
      const overlay: Partial<ChatDict> = {};
      // Only copy through fields the chat chrome knows about.
      if (typeof src.dir === "string") overlay.dir = src.dir === "rtl" ? "rtl" : "ltr";
      if (typeof src.lang_name === "string") overlay.lang_name = src.lang_name;
      if (typeof src.app_title === "string") overlay.app_title = src.app_title;
      if (typeof src.tagline === "string") overlay.tagline = src.tagline;
      if (typeof src.disclaimer === "string") overlay.disclaimer = src.disclaimer;
      if (typeof src.talk_navigator === "string") overlay.talk_navigator = src.talk_navigator;
      const v = src.verdict as Record<string, string> | undefined;
      if (v) {
        overlay.verdict = {
          likely_eligible: v.likely_eligible ?? DICT[lang].verdict.likely_eligible,
          possibly_eligible: v.possibly_eligible ?? DICT[lang].verdict.possibly_eligible,
          likely_not_eligible: v.likely_not_eligible ?? DICT[lang].verdict.likely_not_eligible,
        };
      }
      next[lang] = overlay;
    });
    enriched = next;
  } catch {
    // Offline / fetch error: keep the embedded dictionary. App still works.
  }
}
