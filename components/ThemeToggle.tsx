"use client";

import { useEffect, useState } from "react";
import { applyTheme, effectiveTheme, getStoredTheme, setTheme, type Theme } from "../lib/theme";

const Sun = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
const Moon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);

export default function ThemeToggle() {
  const [theme, setT] = useState<Theme>("system");

  useEffect(() => {
    const t = getStoredTheme();
    setT(t);
    applyTheme(t);
  }, []);

  const eff = effectiveTheme(theme);
  function toggle() {
    const next: Theme = eff === "dark" ? "light" : "dark";
    setTheme(next);
    setT(next);
  }

  return (
    <button
      type="button"
      className="theme-btn"
      onClick={toggle}
      aria-label={eff === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {eff === "dark" ? <Sun /> : <Moon />}
    </button>
  );
}
