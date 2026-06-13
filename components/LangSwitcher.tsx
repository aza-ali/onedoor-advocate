"use client";

// Sliding-thumb segmented toggle (Soya / M3 Expressive). The clay thumb glides to the active
// language with the expressive spring; selecting a language regenerates the answer in it.
const LANGS = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fa", label: "فارسی" },
];

export default function LangSwitcher({ lang, onChange }: { lang: string; onChange: (l: string) => void }) {
  const i = Math.max(0, LANGS.findIndex((l) => l.code === lang));
  return (
    <div className="seg" role="radiogroup" aria-label="Language" style={{ ["--n" as any]: LANGS.length, ["--i" as any]: i }}>
      <span className="seg-thumb" aria-hidden />
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          role="radio"
          aria-checked={lang === l.code}
          className={`seg-opt${lang === l.code ? " active" : ""}`}
          onClick={() => onChange(l.code)}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
