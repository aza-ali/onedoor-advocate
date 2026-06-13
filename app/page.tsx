"use client";

import { useCallback, useEffect, useState } from "react";
import Chat from "../components/Chat";
import ThemeToggle from "../components/ThemeToggle";
import { loadProfile, updateProfile } from "../lib/profile";
import type { ActiveLanguage } from "../lib/types";

const DEFAULT_LANG: ActiveLanguage = { label: "English", dir: "ltr", ui: {} };

// A small disclaimer shown under the composer. (The card carries the full, translated one.)
const FALLBACK_DISCLAIMER =
  "This is an eligibility estimate, not a benefits decision or legal advice. Official determinations are made by your county or state agency.";

function GlobeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" />
    </svg>
  );
}

export default function Page() {
  const [language, setLanguage] = useState<ActiveLanguage>(DEFAULT_LANG);

  // Hydrate the saved conversational language after mount (localStorage is client-only).
  useEffect(() => {
    try {
      const p = loadProfile();
      if (p?.language?.label) setLanguage(p.language);
    } catch {
      // no saved language yet
    }
  }, []);

  // Reflect text direction + lang on the document whenever the language changes.
  useEffect(() => {
    const el = document.documentElement;
    el.dir = language.dir;
    el.lang = language.label.toLowerCase().startsWith("english") ? "en" : "";
  }, [language]);

  // The model set the language mid-conversation: store it and apply it.
  const handleLanguage = useCallback((next: ActiveLanguage) => {
    setLanguage(next);
    try { updateProfile({ language: next }); } catch { /* best-effort */ }
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="mark" aria-hidden>1</span>
          One <b>Door</b> Advocate
        </div>
        <div className="header-tools">
          <span className="lang-chip" title="Tell me in chat to switch languages anytime">
            <GlobeIcon />
            {language.label}
          </span>
          <ThemeToggle />
        </div>
      </header>

      <main className="app-main">
        <Chat language={language} onLanguage={handleLanguage} />
      </main>

      <footer className="app-footer">
        <p className="disclaimer">{language.ui?.disclaimer || FALLBACK_DISCLAIMER}</p>
      </footer>
    </div>
  );
}
