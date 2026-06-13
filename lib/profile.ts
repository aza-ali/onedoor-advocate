// Client-safe persistent applicant-profile store.
// localStorage now, shaped so a Firestore backend can replace the I/O later.
// SSR-safe: every accessor guards typeof window === "undefined".

import type { Profile, ScreenResult } from "./types";

const KEY = "onedoor.profile";

// A valid, empty Profile. No timestamp baked in at module load (SSR-safe);
// updated_at is the empty string until the first write fills it.
export const DEFAULT_PROFILE: Profile = {
  schema_version: 1,
  updated_at: "",
  lang: "en",
  household: {},
  extractions: [],
};

const hasWindow = (): boolean => typeof window !== "undefined";

const nowIso = (): string => new Date().toISOString();

// Deep-clone a JSON-safe value so callers never mutate the default or stored copy.
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// Coerce arbitrary parsed JSON into a valid Profile, filling missing fields.
function migrate(raw: any): Profile {
  if (!raw || typeof raw !== "object") return clone(DEFAULT_PROFILE);
  const p: Profile = {
    schema_version: 1,
    updated_at: typeof raw.updated_at === "string" ? raw.updated_at : "",
    lang: raw.lang === "es" || raw.lang === "fa" ? raw.lang : "en",
    household:
      raw.household && typeof raw.household === "object" ? raw.household : {},
    extractions: Array.isArray(raw.extractions) ? raw.extractions : [],
  };
  if (raw.last_result !== undefined) p.last_result = raw.last_result;
  if (raw.language && typeof raw.language === "object" && typeof raw.language.label === "string") {
    p.language = { label: raw.language.label, dir: raw.language.dir === "rtl" ? "rtl" : "ltr", ui: raw.language.ui && typeof raw.language.ui === "object" ? raw.language.ui : {} };
  }
  return p;
}

// Read the stored profile, falling back to a fresh default on miss/parse-error.
export function loadProfile(): Profile {
  if (!hasWindow()) return clone(DEFAULT_PROFILE);
  try {
    const stored = window.localStorage.getItem(KEY);
    if (!stored) return clone(DEFAULT_PROFILE);
    return migrate(JSON.parse(stored));
  } catch {
    return clone(DEFAULT_PROFILE);
  }
}

// Stamp updated_at and persist. No-op when there is no window (SSR).
export function saveProfile(p: Profile): void {
  p.updated_at = nowIso();
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // Storage full or disabled: nothing actionable here.
  }
}

// Shape of an updateProfile patch: any subset of Profile, with household
// merged shallowly (members concatenated) and extractions appended.
export type ProfilePatch = {
  lang?: Profile["lang"];
  language?: Profile["language"];
  household?: Partial<Profile["household"]>;
  extractions?: Profile["extractions"];
  last_result?: ScreenResult | null;
};

// Deep-merge a patch into the current profile, then save and return it.
export function updateProfile(patch: ProfilePatch): Profile {
  const current = loadProfile();

  if (patch.lang) current.lang = patch.lang;
  if (patch.language) current.language = patch.language;

  if (patch.household) {
    const priorMembers = current.household.members || [];
    const incomingMembers = patch.household.members;
    current.household = { ...current.household, ...patch.household };
    if (incomingMembers) {
      current.household.members = [...priorMembers, ...incomingMembers];
    }
  }

  if (patch.extractions && patch.extractions.length) {
    current.extractions = [...current.extractions, ...patch.extractions];
  }

  if (patch.last_result !== undefined) current.last_result = patch.last_result;

  saveProfile(current);
  return current;
}

// Append a confirmed extraction record AND merge its fields into household,
// then persist. Returns the updated profile.
export function addExtraction(
  source: string,
  fields: Record<string, any>
): Profile {
  const current = loadProfile();
  current.extractions = [
    ...current.extractions,
    { source, fields, confirmed: true, at: nowIso() },
  ];
  current.household = { ...current.household, ...fields };
  saveProfile(current);
  return current;
}

// Remove the stored profile entirely. No-op under SSR.
export function clearProfile(): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing actionable.
  }
}
