// storage.js — localStorage load and save, export and import, backup-age.
//
// All tools in the family share one GitHub Pages origin, so keys are namespaced
// and versioned. The whole document (the user's settings) lives in one key; the
// device-only backup timestamp lives in its own key and never appears in an
// export. Every setItem is wrapped in try/catch: quota overflow and Safari
// private mode both throw, and the write silently does not happen.

const DOC_KEY = "marathon-countdown:v1";       // the document (settings)
const BACKUP_KEY = "marathon-countdown:backup"; // device-only: last backup time

// The one place the settings shape is defined. Optional future fields (a goal
// pace, for example) can be added here and stay valid when absent, with no
// migration needed.
export const DEFAULT_SETTINGS = {
  schemaVersion: 1,
  raceDate: "",        // "YYYY-MM-DD"
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

// ---- Backup-age tracking (device-only) ----

export function getLastBackup() {
  try {
    return localStorage.getItem(BACKUP_KEY);   // ISO string or null
  } catch (e) {
    return null;
  }
}

function setLastBackup(iso) {
  try {
    localStorage.setItem(BACKUP_KEY, iso);
    return true;
  } catch (e) {
    return false;
  }
}

// "Last backup: never" / "today" / "3 days ago". Rendered from the first paint.
export function backupStatusText() {
  const iso = getLastBackup();
  if (!iso) return "Last backup: never";
  const then = new Date(iso);
  const now = new Date();
  const days = Math.floor(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()) -
     new Date(then.getFullYear(), then.getMonth(), then.getDate())) /
    (24 * 60 * 60 * 1000)
  );
  if (days <= 0) return "Last backup: today";
  if (days === 1) return "Last backup: 1 day ago";
  return `Last backup: ${days} days ago`;
}

// ---- Export and import ----

// Build the export payload. schemaVersion travels with the data from day one.
export function buildExport(settings) {
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    settings: { ...settings, schemaVersion: 1 }
  };
}

// Trigger a download of the settings as JSON. Filename ends in the date so a
// folder of backups sorts itself. Marks the backup time on success.
export function exportToFile(settings) {
  const payload = buildExport(settings);
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);   // YYYY-MM-DD
  const a = document.createElement("a");
  a.href = url;
  a.download = `marathon-countdown-${date}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  setLastBackup(new Date().toISOString());
}

// Parse an imported file's text. Checks schemaVersion and returns the settings.
// Throws with a plain message the caller can show if the file is not valid.
export function parseImport(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error("That file is not valid JSON.");
  }
  if (!data || data.schemaVersion !== 1) {
    throw new Error("That file is not a Marathon Countdown backup (version 1).");
  }
  const s = data.settings || {};
  return {
    ...DEFAULT_SETTINGS,
    raceDate: typeof s.raceDate === "string" ? s.raceDate : "",
    weeklyVolumeKm: typeof s.weeklyVolumeKm === "number" ? s.weeklyVolumeKm : null,
    blockWeeks: [16, 18, 20].includes(s.blockWeeks) ? s.blockWeeks : 18,
    schemaVersion: 1
  };
}
