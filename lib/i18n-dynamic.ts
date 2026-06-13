// SERVER-ONLY. Realtime, model-written i18n. The deterministic engine produces a canonical
// English answer card (numbers + citations are facts). For ANY language the user asks for in
// conversation ("I speak Traditional Chinese", "هندي", "Tagalog please"), the model translates
// the card's PROSE in realtime, keeping every digit, $, %, URL, phone, and program proper-name
// verbatim. So the dollars and citations stay identical across languages; only the words change.
import "server-only";
import { getClient, hasKey, MODEL } from "./anthropic";
import { runScreen, type Household } from "./engine";

// The model writes the i18n in realtime. Defaults to the same model the chat uses (proven to
// respond in this runtime); override with TRANSLATE_MODEL (e.g. a faster model once verified).
// A hard timeout falls back to English prose with the correct direction so the card never blocks.
// FAST-FOLLOW: a faster translation model needs in-runtime verification; opus is the safe default.
const TRANSLATE_MODEL = process.env.TRANSLATE_MODEL || MODEL;
const TRANSLATE_TIMEOUT_MS = 22000;

// Languages written right-to-left (by endonym/exonym/code). Used to set `dir` deterministically.
const RTL = /(arab|عرب|farsi|فارس|persian|dari|پشت|pashto|urdu|اردو|hebrew|עבר|yiddish|sindhi|kurdish \(sorani\)|sorani|divehi|maldiv|uyghur|ئۇيغۇر)/i;
function dirFor(language: string): "rtl" | "ltr" {
  return RTL.test(language) ? "rtl" : "ltr";
}

// A language counts as "English" (no translation needed) under several spellings/codes.
function isEnglish(language: string): boolean {
  return /^(en|en-\w+|english|inglés|ingles)$/i.test(String(language || "").trim());
}

// in-memory cache (per server instance). key = language + hash of the english payload.
const cache = new Map<string, any>();
function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

// Extract only the translatable strings from a card (numbers/citations stay outside this).
function extractStrings(card: any) {
  return {
    verdict_label: card.verdict_label,
    per_mo: card.per_mo,
    sec_qualify: card.sec_qualify,
    sec_bring: card.sec_bring,
    sec_ask: card.sec_ask,
    sec_also: card.sec_also,
    why: (card.why || []).map((w: any) => w.text),
    bring: card.bring || [],
    ask: card.ask || [],
    recs: (card.recs || []).map((r: any) => ({ program: r.program, reason: r.reason, next_step: r.next_step })),
    disclaimer: card.disclaimer,
    talk_navigator: card.talk_navigator,
  };
}

const SYSTEM = `You are a precise localization engine for a public-benefits app. You translate UI strings into a target language for a person seeking help. RULES, in order of importance:
1. Keep EVERY number, digit, currency symbol ($), percent (%), date, URL, email, phone number, and EBT/program code EXACTLY as written. Never convert, localize, or re-format a numeral or a dollar amount.
2. Keep program proper names verbatim in Latin script: CalFresh, SNAP, Medi-Cal, WIC, CalEITC, SUN Bucks, CARE, FERA, LifeLine, BenefitsCal, GetCalFresh, Medicare, Medicaid, PG&E, SCE, SDG&E, ftb.ca.gov. You may add a short native gloss in parentheses if natural, but the Latin name must remain.
3. Translate the rest naturally, warmly, and clearly, the way a trusted local navigator would speak. Match the register of someone helping a neighbor.
4. Return ONLY a JSON object with the SAME keys and array lengths as the input. Do not add commentary.`;

// Translate a canonical English card into `language`. Returns the same card shape with prose
// translated and `dir` set. English (or missing key) returns the card unchanged.
export async function translateCard(card: any, language: string): Promise<any> {
  if (!card || isEnglish(language)) return { ...card, dir: "ltr", lang_label: "English" };
  const dir = dirFor(language);
  const payload = extractStrings(card);
  const key = `${language.toLowerCase()}::${hash(JSON.stringify(payload))}`;
  const cached = cache.get(key);
  if (cached) return { ...card, ...cached, dir, lang_label: language };
  if (!hasKey()) return { ...card, dir, lang_label: language }; // offline: keep English prose, correct dir

  try {
    const client = getClient();
    const t0 = Date.now();
    const resp: any = await Promise.race([
      client.messages.create(
        {
          model: TRANSLATE_MODEL,
          max_tokens: 2000,
          system: SYSTEM,
          messages: [{ role: "user", content: `Target language: ${language}\n\nTranslate this JSON, following every rule:\n${JSON.stringify(payload)}` }],
        },
        { maxRetries: 1 }
      ),
      new Promise((_, rej) => setTimeout(() => rej(new Error("translate-timeout")), TRANSLATE_TIMEOUT_MS)),
    ]);
    void t0;
    const text = (resp.content?.[0] as any)?.text || "{}";
    const json = JSON.parse(text.replace(/^```json\s*|\s*```$/g, "").trim());
    // Rebuild card with translated strings, preserving numbers/structure from the original.
    const translated = {
      verdict_label: json.verdict_label ?? card.verdict_label,
      per_mo: json.per_mo ?? card.per_mo,
      sec_qualify: json.sec_qualify ?? card.sec_qualify,
      sec_bring: json.sec_bring ?? card.sec_bring,
      sec_ask: json.sec_ask ?? card.sec_ask,
      sec_also: json.sec_also ?? card.sec_also,
      why: (card.why || []).map((w: any, i: number) => ({ ...w, text: json.why?.[i] ?? w.text })),
      bring: Array.isArray(json.bring) && json.bring.length === (card.bring || []).length ? json.bring : card.bring,
      ask: Array.isArray(json.ask) && json.ask.length === (card.ask || []).length ? json.ask : card.ask,
      recs: (card.recs || []).map((r: any, i: number) => ({
        ...r,
        program: json.recs?.[i]?.program ?? r.program,
        reason: json.recs?.[i]?.reason ?? r.reason,
        next_step: json.recs?.[i]?.next_step ?? r.next_step,
      })),
      disclaimer: json.disclaimer ?? card.disclaimer,
      talk_navigator: json.talk_navigator ?? card.talk_navigator,
    };
    cache.set(key, translated);
    return { ...card, ...translated, dir, lang_label: language };
  } catch {
    // any failure / slow translation: fall back to English prose with the correct direction
    // (the numbers + citations are always correct; only the prose stays English). Never blocks.
    return { ...card, dir, lang_label: language };
  }
}

// Screen a household and return the full result with its card localized into `language`.
// Numbers come from the deterministic engine; only the card prose is model-translated.
export async function localizeResult(household: Household, language: string) {
  const result = runScreen(household, "en"); // canonical English card + the authoritative numbers
  const card = await translateCard(result.presentation, language || "English");
  return { ...result, presentation: card, dir: card.dir };
}

export { dirFor, isEnglish };
