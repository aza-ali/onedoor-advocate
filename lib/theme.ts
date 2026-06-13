// Light / dark theming. `system` follows the OS; `light`/`dark` pin it via the data-theme
// attribute on <html> (which globals.css reads). SSR-safe.
export type Theme = "light" | "dark" | "system";
const KEY = "onedoor.theme";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "light" || v === "dark" || v === "system" ? v : "system";
  } catch {
    return "system";
  }
}

export function applyTheme(t: Theme): void {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  if (t === "system") el.removeAttribute("data-theme");
  else el.setAttribute("data-theme", t);
}

export function setTheme(t: Theme): void {
  try { window.localStorage.setItem(KEY, t); } catch { /* storage disabled */ }
  applyTheme(t);
}

export function effectiveTheme(t: Theme): "light" | "dark" {
  if (t !== "system") return t;
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "light";
}
