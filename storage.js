// storage.js — localStorage load and save for the user's settings.
//
// All tools in the family share one GitHub Pages origin, so the key is
// namespaced and versioned. Every setItem is wrapped in try/catch: quota
// overflow and Safari private mode both throw, and the write silently does not
// happen, so the caller is told when a save fails.

const DOC_KEY = "marathon-countdown:v1";       // the document (settings)

// The one place the settings shape is defined. Optional future fields (a goal
// pace, for example) can be added here and stay valid when absent, with no
// migration needed.
export const DEFAULT_SETTINGS = {
  schemaVersion: 1,
  raceDate: "",         // "YYYY-MM-DD"
  weeklyVolumeKm: null, // number or null (optional)
  blockWeeks: 18        // 16 | 18 | 20
};

// Load settings, merged over the defaults so missing fields are always valid.
export function loadSettings() {
  try {
    const raw = localStorage.getItem(DOC_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed, schemaVersion: 1 };
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}

// Save settings. Returns true on success, false if the write did not happen
// (quota or private mode). The caller must tell the user when this returns false.
export function saveSettings(settings) {
  const doc = { ...settings, schemaVersion: 1 };
  try {
    localStorage.setItem(DOC_KEY, JSON.stringify(doc));
    return true;
  } catch (e) {
    return false;
  }
}

export function hasSettings() {
  const s = loadSettings();
  return Boolean(s.raceDate);
}
