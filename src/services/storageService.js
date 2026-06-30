const KEYS = {
  history: "settleit_history",
  streak: "settleit_streak",
  theme: "settleit_theme",
  sound: "settleit_sound",
  accent: "settleit_accent_theme",
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable — silently ignore
  }
}

// History — Verdict[]
export function getHistory() {
  return read(KEYS.history, []);
}

export function addVerdict(verdict) {
  const history = getHistory();
  write(KEYS.history, [verdict, ...history]);
}

export function deleteVerdict(id) {
  write(KEYS.history, getHistory().filter((v) => v.id !== id));
}

export function clearHistory() {
  localStorage.removeItem(KEYS.history);
}

// Streak — { current, best }
export function getStreak() {
  return read(KEYS.streak, { current: 0, best: 0 });
}

export function updateStreak(won) {
  const streak = getStreak();
  const next = won
    ? {
        current: streak.current + 1,
        best: Math.max(streak.best, streak.current + 1),
      }
    : { current: 0, best: streak.best };
  write(KEYS.streak, next);
  return next;
}

// Theme preference — "dark" | "light" | "system"
export function getThemePreference() {
  return read(KEYS.theme, "system");
}

export function setThemePreference(theme) {
  write(KEYS.theme, theme);
}

// Sound preference — boolean (default true for new users)
export function getSoundPreference() {
  const raw = localStorage.getItem(KEYS.sound);
  return raw === null ? true : JSON.parse(raw);
}

export function setSoundPreference(enabled) {
  write(KEYS.sound, enabled);
}

// Reset streak to zero (used by clear all history)
export function resetStreak() {
  write(KEYS.streak, { current: 0, best: 0 });
}

// Accent theme — "purple" | "forest"
export function getAccentTheme() {
  return read(KEYS.accent, "purple");
}

export function setAccentTheme(theme) {
  write(KEYS.accent, theme);
}
