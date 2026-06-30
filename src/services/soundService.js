import { getSoundPreference } from "./storageService";

function playTone(ctx, freq, startDelay, duration) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.value = freq;
  const t = ctx.currentTime + startDelay;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.22, t + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration / 1000);
  osc.start(t);
  osc.stop(t + duration / 1000 + 0.05);
}

export function playVerdictSound(sideAPercentage) {
  if (!getSoundPreference()) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (sideAPercentage >= 85) {
      // Ascending two-note chime for big wins
      playTone(ctx, 880, 0, 160);
      playTone(ctx, 1100, 0.21, 220);
    } else {
      // Single clean tone for standard verdicts
      playTone(ctx, 920, 0, 190);
    }
  } catch {
    // AudioContext unavailable — silent fallback
  }
}
