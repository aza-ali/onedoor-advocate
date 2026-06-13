"use client";

import { useEffect, useState } from "react";
import Chat from "../components/Chat";
import LangSwitcher from "../components/LangSwitcher";
import { loadProfile, updateProfile } from "../lib/profile";

const DISCLAIMER: Record<string, string> = {
  en: "This is an eligibility estimate, not a benefits decision or legal advice. Official determinations are made by your county or state agency.",
  es: "Esto es una estimacion de elegibilidad, no una decision de beneficios ni asesoria legal. Las determinaciones oficiales las hace su agencia del condado o del estado.",
  fa: "این یک برآورد واجد شرایط بودن است، نه تصمیم رسمی یا مشاوره حقوقی. تصمیم نهایی توسط اداره شهرستان یا ایالت شما گرفته می‌شود.",
};

export default function Page() {
  const [lang, setLang] = useState<string>("en");

  // Hydrate language from the saved profile after mount (localStorage is client-only).
  useEffect(() => {
    try {
      const p = loadProfile();
      if (p?.lang) setLang(p.lang);
    } catch {
      // no saved profile yet; keep the default
    }
  }, []);

  // Reflect the active language on the document (direction + lang) and persist it.
  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang;
    el.dir = lang === "fa" ? "rtl" : "ltr";
  }, [lang]);

  function handleLangChange(next: string) {
    setLang(next);
    try {
      updateProfile({ lang: next as "en" | "es" | "fa" });
    } catch {
      // persistence is best-effort; the UI still switches
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          One <b>Door</b> Advocate
        </div>
        <LangSwitcher lang={lang} onChange={handleLangChange} />
      </header>

      <main className="app-main">
        <Chat lang={lang} />
      </main>

      <footer className="app-footer">
        <p
          style={{
            margin: 0,
            fontSize: 11,
            lineHeight: 1.45,
            color: "var(--mut)",
            textAlign: "center",
          }}
        >
          {DISCLAIMER[lang] ?? DISCLAIMER.en}
        </p>
      </footer>
    </div>
  );
}
