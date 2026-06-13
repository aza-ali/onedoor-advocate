'use client';

import { applyDir, type Lang } from '../lib/i18n-client';

const LANGS: { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fa', label: 'فارسی' },
];

export default function LangSwitcher({
  lang,
  onChange,
}: {
  lang: string;
  onChange: (l: string) => void;
}) {
  function pick(code: Lang) {
    applyDir(code); // flip layout to RTL immediately for Farsi
    onChange(code);
  }

  return (
    <div
      role="group"
      aria-label="Language"
      style={{
        display: 'inline-flex',
        gap: 4,
        padding: 3,
        borderRadius: 999,
        border: '1px solid var(--line)',
        background: 'transparent',
      }}
    >
      {LANGS.map(({ code, label }) => {
        const active = lang === code;
        return (
          <button
            key={code}
            type="button"
            lang={code}
            aria-pressed={active}
            onClick={() => pick(code)}
            style={{
              appearance: 'none',
              cursor: 'pointer',
              border: 'none',
              borderRadius: 999,
              padding: '7px 14px',
              minHeight: 36,
              fontSize: 14,
              lineHeight: 1,
              whiteSpace: 'nowrap',
              fontWeight: active ? 600 : 500,
              color: active ? '#fff' : 'var(--mut)',
              background: active ? 'var(--accent2)' : 'transparent',
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
