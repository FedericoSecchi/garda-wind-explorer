// ─────────────────────────────────────────────────────────────
// Hourly wind evaluation
// Combines rider range + spot rules to produce a per-hour rating.
// ─────────────────────────────────────────────────────────────

import { RiderWindRange } from "./riderProfile";
import { SpotRules, evalDirection, DIR_SCORE } from "./spotRules";

export type HourRating = "NOT_RIDABLE" | "POSSIBLE" | "GOOD" | "IDEAL";

export interface HourEval {
  hour:        number;      // 0-23
  rating:      HourRating;
  score:       number;      // 0-100
  speedOk:     boolean;
  directionOk: boolean;     // direction is valid OR ideal
  gustsOk:     boolean;
  dirLabel:    string;      // e.g. "Ora (S)"
  dirQuality:  string;      // "ideal" | "valid" | "bad" | "dangerous"
  reasons:     string[];    // human-readable issues
}

// ── Speed scoring ─────────────────────────────────────────────
function speedScore(kn: number, range: RiderWindRange): number {
  const { minUsable, idealMin, idealMax, maxSafe } = range;
  if (kn < minUsable)   return 0;
  if (kn > maxSafe)     return 0;
  if (kn >= idealMin && kn <= idealMax) {
    // 85–100 depending on how close to center of ideal range
    const center = (idealMin + idealMax) / 2;
    const half   = (idealMax - idealMin) / 2;
    const dist   = Math.abs(kn - center) / Math.max(half, 1);
    return Math.round(100 - dist * 15);
  }
  if (kn < idealMin) {
    // minUsable → idealMin: 30→70
    return Math.round(30 + (kn - minUsable) / Math.max(idealMin - minUsable, 1) * 40);
  }
  // idealMax → maxSafe: 70→30
  return Math.round(70 - (kn - idealMax) / Math.max(maxSafe - idealMax, 1) * 40);
}

// ── Gust scoring ──────────────────────────────────────────────
function gustScore(
  windSpeed: number,
  gustSpeed: number,
  range: RiderWindRange,
  gustChar: SpotRules["gustChar"]
): number {
  if (gustSpeed <= 0) return 100;   // no gust data → no penalty
  if (gustSpeed > range.maxSafe) return 0;   // dangerous

  const ratio = gustSpeed / Math.max(windSpeed, 1);
  // Threshold above which we start penalising
  const ratioThreshold = gustChar === "stable" ? 1.30
    : gustChar === "moderate" ? 1.40 : 1.55;

  let score = 100;
  // Penalty for gusts above ideal max
  if (gustSpeed > range.idealMax) {
    const excess = gustSpeed - range.idealMax;
    const room   = range.maxSafe - range.idealMax;
    score -= Math.round((excess / Math.max(room, 1)) * 30);
  }
  // Additional penalty for high gust ratio (unexpected variability)
  if (ratio > ratioThreshold) {
    score -= Math.round((ratio - ratioThreshold) / 0.2 * 20);
  }
  return Math.max(0, Math.min(100, score));
}

// ── Main evaluator ────────────────────────────────────────────
export function evaluateHour(
  hour:      number,
  windSpeed: number,
  windDir:   number,
  gustSpeed: number,
  range:     RiderWindRange,
  rules:     SpotRules | null,
): HourEval {
  const reasons: string[] = [];

  // 1. Speed
  const spScore = speedScore(windSpeed, range);
  const speedOk = spScore > 0;
  if (!speedOk) {
    reasons.push(
      windSpeed < range.minUsable
        ? `Viento insuficiente (${windSpeed} kn, mín ${range.minUsable} kn)`
        : `Viento excesivo (${windSpeed} kn, máx ${range.maxSafe} kn)`
    );
  }

  // 2. Direction
  let dirScore = 50;   // neutral when no rules
  let dirLabel = "Sin datos de dirección";
  let dirQuality: string = "valid";
  let dangerous = false;

  if (rules) {
    const dir = evalDirection(windDir, rules);
    dirScore   = DIR_SCORE[dir.quality];
    dirLabel   = dir.label;
    dirQuality = dir.quality;
    dangerous  = dir.dangerous;
    if (dir.quality === "bad" || dir.quality === "dangerous") {
      reasons.push(`Dirección desfavorable: ${dir.label}`);
    }
  }
  const directionOk = dirScore >= 60;

  // 3. Gusts
  const gScore  = gustScore(windSpeed, gustSpeed, range, rules?.gustChar ?? "moderate");
  const gustsOk = gScore > 0;
  if (!gustsOk) {
    reasons.push(`Ráfagas peligrosas (${gustSpeed} kn > ${range.maxSafe} kn)`);
  } else if (gScore < 60) {
    reasons.push(`Ráfagas elevadas (${gustSpeed} kn)`);
  }

  // 4. Composite score (weighted)
  const score = Math.round(
    spScore * 0.50 +
    dirScore * 0.30 +
    gScore  * 0.20
  );

  // 5. Rating
  let rating: HourRating;
  if (!speedOk || !gustsOk || dangerous) {
    rating = "NOT_RIDABLE";
  } else if (score >= 78 && directionOk) {
    rating = "IDEAL";
  } else if (score >= 58) {
    rating = "GOOD";
  } else if (score >= 35) {
    rating = "POSSIBLE";
  } else {
    rating = "NOT_RIDABLE";
  }

  return { hour, rating, score, speedOk, directionOk, gustsOk, dirLabel, dirQuality, reasons };
}

// ── Rating helpers ────────────────────────────────────────────
export const RATING_ORDER: Record<HourRating, number> = {
  NOT_RIDABLE: 0,
  POSSIBLE:    1,
  GOOD:        2,
  IDEAL:       3,
};

export function bestRating(a: HourRating, b: HourRating): HourRating {
  return RATING_ORDER[a] >= RATING_ORDER[b] ? a : b;
}

export const RATING_COLOR: Record<HourRating, string> = {
  NOT_RIDABLE: "text-red-400",
  POSSIBLE:    "text-yellow-400",
  GOOD:        "text-sky-400",
  IDEAL:       "text-emerald-400",
};

export const RATING_BG: Record<HourRating, string> = {
  NOT_RIDABLE: "bg-red-500/10",
  POSSIBLE:    "bg-yellow-500/10",
  GOOD:        "bg-sky-500/10",
  IDEAL:       "bg-emerald-500/10",
};

export const RATING_BORDER: Record<HourRating, string> = {
  NOT_RIDABLE: "border-red-500/30",
  POSSIBLE:    "border-yellow-500/30",
  GOOD:        "border-sky-500/30",
  IDEAL:       "border-emerald-500/30",
};

export const RATING_LABEL: Record<HourRating, string> = {
  NOT_RIDABLE: "No navegable",
  POSSIBLE:    "Posible",
  GOOD:        "Bueno",
  IDEAL:       "Ideal",
};
