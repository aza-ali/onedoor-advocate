"use client";

// Sliding-thumb segmented toggle (Soya / M3 Expressive). The clay thumb glides to the active
// language with the expressive spring; selecting a language regenerates the answer in it.
// Implements the WAI-ARIA radiogroup keyboard model (roving tabindex + arrow navigation).
const LANGS = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fa", label: "فارسی" },
];

export default function LangSwitcher({ lang, onChange }: { lang: string; onChange: (l: string) => void }) {
  const i = Math.max(0, LANGS.findIndex((l) => l.code === lang));

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % LANGS.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + LANGS.length) % LANGS.length;
    if (next >= 0) {
      e.preventDefault();
      onChange(LANGS[next].code);
    }
  }

  return (
    <div
      className="seg"
      role="radiogroup"
      aria-label="Language"
      onKeyDown={onKeyDown}
      style={{ ["--n" as any]: LANGS.length, ["--i" as any]: i }}
    >
      <span className="seg-thumb" aria-hidden />
      {LANGS.map((l) => {
        const active = lang === l.code;
        return (
          <button
            key={l.code}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            className={`seg-opt${active ? " active" : ""}`}
            onClick={() => onChange(l.code)}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
