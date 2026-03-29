// ─────────────────────────────────────────────────────────────
// Navigable window detection
// Groups consecutive ridable hours into sailing windows.
// ─────────────────────────────────────────────────────────────

import { HourEval, HourRating, RATING_ORDER, bestRating } from "./hourlyEval";

export interface SailingWindow {
  fromHour: number;
  toHour:   number;
  hours:    number;         // duration
  quality:  HourRating;     // best rating found inside
  avgScore: number;         // average composite score 0-100
  peakKn:   number;         // peak wind speed inside window
}

// A gap of N consecutive not-ridable hours breaks a window.
const MAX_GAP = 1;

// Minimum consecutive ridable hours to be counted as a window.
const MIN_WINDOW_HOURS = 2;

export function detectWindows(
  hourEvals: HourEval[],
  hourSpeeds: Map<number, number>,  // hour → windSpeed (kn) for peakKn calc
): SailingWindow[] {
  const windows: SailingWindow[] = [];

  let windowStart: number | null = null;
  let windowHours: HourEval[]    = [];
  let gapCount = 0;

  const flush = () => {
    if (windowHours.length < MIN_WINDOW_HOURS) return;

    const ridable = windowHours.filter(h => h.rating !== "NOT_RIDABLE");
    if (ridable.length < MIN_WINDOW_HOURS) return;

    const first = ridable[0];
    const last  = ridable[ridable.length - 1];

    const quality = ridable.reduce(
      (best, h) => bestRating(best, h.rating),
      "NOT_RIDABLE" as HourRating
    );

    const avgScore = Math.round(
      ridable.reduce((s, h) => s + h.score, 0) / ridable.length
    );

    const peakKn = Math.max(
      ...ridable.map(h => hourSpeeds.get(h.hour) ?? 0)
    );

    windows.push({
      fromHour: first.hour,
      toHour:   last.hour,
      hours:    last.hour - first.hour + 1,
      quality,
      avgScore,
      peakKn,
    });
  };

  for (const ev of hourEvals) {
    const ridable = ev.rating !== "NOT_RIDABLE";

    if (ridable) {
      if (windowStart === null) {
        windowStart = ev.hour;
        windowHours = [];
        gapCount    = 0;
      }
      // Back-fill any gap hours that were tolerated
      windowHours.push(ev);
      gapCount = 0;
    } else {
      if (windowStart !== null) {
        gapCount++;
        windowHours.push(ev);   // include gap hour in window (will be filtered later)
        if (gapCount > MAX_GAP) {
          flush();
          windowStart = null;
          windowHours = [];
          gapCount    = 0;
        }
      }
    }
  }
  flush();

  return windows
    .filter(w => RATING_ORDER[w.quality] > 0)  // at least POSSIBLE
    .sort((a, b) => b.avgScore - a.avgScore);   // best first
}

// Find the single best window from a list
export function bestWindow(windows: SailingWindow[]): SailingWindow | null {
  if (windows.length === 0) return null;
  return windows.reduce((best, w) =>
    RATING_ORDER[w.quality] > RATING_ORDER[best.quality]
    || (RATING_ORDER[w.quality] === RATING_ORDER[best.quality] && w.avgScore > best.avgScore)
      ? w : best
  );
}

// Format window for display: "14:00–17:00 (3h)"
export function formatWindow(w: SailingWindow): string {
  return `${w.fromHour}:00–${w.toHour}:00 (${w.hours}h)`;
}
