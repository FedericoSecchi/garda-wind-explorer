// ─────────────────────────────────────────────────────────────
// Daily score calculator
// Produces a 0-100 score, GO/MAYBE/NO GO label,
// and HIGH/MEDIUM/LOW model confidence from multi-model data.
// ─────────────────────────────────────────────────────────────

import { ForecastDay, ForecastHour } from "@/data/forecast";
import { ModelForecast } from "@/hooks/useForecast";
import { RiderWindRange, getRiderWindRange, RiderProfile } from "./riderProfile";
import { SpotRules, getSpotRules } from "./spotRules";
import { HourEval, evaluateHour, RATING_ORDER } from "./hourlyEval";
import { SailingWindow, detectWindows, bestWindow } from "./windowDetector";

// ── Public types ──────────────────────────────────────────────

export type DayLabel      = "NO GO" | "MAYBE" | "GO";
export type ConfidenceLevel = "LOW" | "MEDIUM" | "HIGH";

export interface ModelAgreement {
  confidence:   ConfidenceLevel;
  avgStdDev:    number | null;   // average std-dev of wind speeds across models
  modelCount:   number;
}

export interface DayScore {
  score:        number;          // 0-100
  label:        DayLabel;
  confidence:   ConfidenceLevel;
  windows:      SailingWindow[];
  best:         SailingWindow | null;
  hourEvals:    HourEval[];
  explanation:  string;
}

// ── Model agreement ───────────────────────────────────────────

export function getModelAgreement(
  models: ModelForecast[],
  dayIndex: number,
): ModelAgreement {
  const avail = models.filter(
    m => m.available && (m.forecast[dayIndex]?.hours?.length ?? 0) > 0
  );
  if (avail.length < 2) {
    return { confidence: "LOW", avgStdDev: null, modelCount: avail.length };
  }

  const refHours = avail[0].forecast[dayIndex].hours;
  const stdDevs: number[] = [];

  for (const refHour of refHours) {
    const h = refHour.time.getHours();
    const speeds = avail
      .map(m => m.forecast[dayIndex].hours.find(mh => mh.time.getHours() === h)?.windSpeed ?? null)
      .filter((v): v is number => v !== null);
    if (speeds.length < 2) continue;
    const mean = speeds.reduce((a, b) => a + b) / speeds.length;
    const variance = speeds.reduce((s, v) => s + (v - mean) ** 2, 0) / speeds.length;
    stdDevs.push(Math.sqrt(variance));
  }

  const avg = stdDevs.length
    ? stdDevs.reduce((a, b) => a + b) / stdDevs.length
    : null;

  const confidence: ConfidenceLevel = avg === null ? "LOW"
    : avg < 2.5 ? "HIGH"
    : avg < 5.0 ? "MEDIUM"
    : "LOW";

  return {
    confidence,
    avgStdDev:  avg !== null ? Math.round(avg * 10) / 10 : null,
    modelCount: avail.length,
  };
}

// ── Score calculation ─────────────────────────────────────────

export function scoreDay(
  day:      ForecastDay,
  profile:  RiderProfile,
  spotId:   string,
  models:   ModelForecast[],
  dayIndex: number,
): DayScore {
  const range = getRiderWindRange(profile);
  const rules = getSpotRules(spotId);

  // Build hour evals from the primary day forecast
  const speedMap = new Map<number, number>();
  const hourEvals: HourEval[] = day.hours.map(h => {
    speedMap.set(h.time.getHours(), h.windSpeed);
    return evaluateHour(
      h.time.getHours(),
      h.windSpeed,
      h.windDirection,
      h.gustSpeed,
      range,
      rules,
    );
  });

  // Detect windows
  const windows = detectWindows(hourEvals, speedMap);
  const best    = bestWindow(windows);

  // Model agreement
  const agreement = getModelAgreement(models, dayIndex);

  // ── Score components ────────────────────────────────────────
  // 1. Ideal hours ratio (0-40 pts)
  const ridableHours = hourEvals.filter(h => h.rating !== "NOT_RIDABLE").length;
  const idealHours   = hourEvals.filter(h => h.rating === "IDEAL").length;
  const totalHours   = Math.max(hourEvals.length, 1);
  const idealPct     = idealHours / totalHours;
  const ridablePct   = ridableHours / totalHours;
  const pts_speed    = Math.round(idealPct * 30 + ridablePct * 10);

  // 2. Best window duration (0-25 pts)
  const winHours   = best ? Math.min(best.hours, 6) : 0;
  const pts_window = Math.round((winHours / 6) * 25);

  // 3. Direction quality (0-20 pts)
  const dirGoodHours = hourEvals.filter(h => h.directionOk || !rules).length;
  const pts_dir      = Math.round((dirGoodHours / totalHours) * 20);

  // 4. Gust stability (0-15 pts)
  const gustOkHours = hourEvals.filter(h => h.gustsOk).length;
  const pts_gust    = Math.round((gustOkHours / totalHours) * 15);

  const rawScore = pts_speed + pts_window + pts_dir + pts_gust;

  // Confidence bonus/penalty (-10 to +0)
  const confidenceAdj = agreement.confidence === "HIGH" ? 0
    : agreement.confidence === "MEDIUM" ? -5 : -10;

  const score = Math.max(0, Math.min(100, rawScore + confidenceAdj));

  // ── Label ────────────────────────────────────────────────────
  const label: DayLabel = score >= 60 ? "GO"
    : score >= 30       ? "MAYBE"
    : "NO GO";

  // ── Explanation ──────────────────────────────────────────────
  const exp = buildExplanation(score, label, best, idealHours, agreement, rules);

  return { score, label, confidence: agreement.confidence, windows, best, hourEvals, explanation: exp };
}

function buildExplanation(
  score:     number,
  label:     DayLabel,
  best:      SailingWindow | null,
  idealHours: number,
  agreement: ModelAgreement,
  rules:     SpotRules | null,
): string {
  const parts: string[] = [];

  if (label === "GO") {
    parts.push(best
      ? `Ventana: ${best.fromHour}:00–${best.toHour}:00 (${best.hours}h, ${best.quality})`
      : `${idealHours}h con condiciones ideales`);
  } else if (label === "MAYBE") {
    parts.push(best
      ? `Ventana marginal: ${best.fromHour}:00–${best.toHour}:00`
      : "Condiciones parciales");
  } else {
    parts.push("Sin ventana navegable");
  }

  if (rules && label !== "NO GO") {
    parts.push(`Spot: ${rules.gustChar === "gusty" ? "viento racheado" : rules.gustChar === "stable" ? "viento estable" : "condiciones moderadas"}`);
  }

  parts.push(`Confianza: ${agreement.confidence} (${agreement.modelCount} modelos${agreement.avgStdDev !== null ? `, ±${agreement.avgStdDev} kn` : ""})`);
  parts.push(`Score: ${score}/100`);

  return parts.join(" · ");
}

// ── Convenience: score multiple days ─────────────────────────

export function scoreDays(
  forecast: ForecastDay[],
  profile:  RiderProfile,
  spotId:   string,
  models:   ModelForecast[],
): DayScore[] {
  return forecast.map((day, i) => scoreDay(day, profile, spotId, models, i));
}

// ── Label styling ─────────────────────────────────────────────

export const LABEL_CONFIG: Record<DayLabel, { color: string; bg: string; border: string; icon: string }> = {
  "GO":     { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: "GO"    },
  "MAYBE":  { color: "text-yellow-400",  bg: "bg-yellow-500/10",  border: "border-yellow-500/30",  icon: "~"     },
  "NO GO":  { color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/30",     icon: "✗"     },
};

export const CONFIDENCE_CONFIG: Record<ConfidenceLevel, { color: string; label: string }> = {
  HIGH:   { color: "text-emerald-400", label: "Alta confianza"   },
  MEDIUM: { color: "text-yellow-400",  label: "Confianza media"  },
  LOW:    { color: "text-red-400",     label: "Baja confianza"   },
};
