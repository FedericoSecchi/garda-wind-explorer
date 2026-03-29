// ¿Navego? — Perfil arriba, resultado abajo.
// Usa currentWind (API real) + todayForecast para la decisión.
// Incorpora getSpotRules para dirección + hourly eval para confianza.

import { useMemo } from "react";
import { Lightbulb, Wind, Compass } from "lucide-react";
import {
  UserProfile,
  evaluateConditions,
  CONDITION_CONFIG,
  getSuggestedKite,
} from "@/lib/windDecision";
import { ForecastDay } from "@/data/forecast";
import { CurrentWind } from "@/hooks/useForecast";
import { Spot } from "@/data/spots";
import { getSpotRules, evalDirection, directionName } from "@/lib/spotRules";
import { evaluateHour, RATING_COLOR, RATING_LABEL } from "@/lib/hourlyEval";
import { getRiderWindRange } from "@/lib/riderProfile";

interface DecisionWidgetProps {
  profile:         UserProfile;
  onProfileChange: (p: UserProfile) => void;
  currentWind:     CurrentWind | null;
  todayForecast:   ForecastDay | null;
  loading:         boolean;
  spot:            Spot;
}

const KITE_SIZES = [7, 9, 10, 12, 14, 15, 17];
const BOARD_LABELS: Record<UserProfile["boardType"], string> = {
  twintip:     "Twin Tip",
  directional: "Direccional",
  foil:        "Foil",
};

const DIR_QUALITY_COLOR: Record<string, string> = {
  ideal:     "text-emerald-400",
  valid:     "text-sky-400",
  bad:       "text-yellow-400",
  dangerous: "text-red-400",
};
const DIR_QUALITY_BADGE: Record<string, string> = {
  ideal:     "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400",
  valid:     "bg-sky-500/15 border border-sky-500/40 text-sky-400",
  bad:       "bg-yellow-500/15 border border-yellow-500/40 text-yellow-400",
  dangerous: "bg-red-500/15 border border-red-500/40 text-red-400",
};
const DIR_QUALITY_CARD: Record<string, string> = {
  ideal:     "bg-emerald-500/10 border-emerald-500/30",
  valid:     "bg-sky-500/10 border-sky-500/30",
  bad:       "bg-yellow-500/10 border-yellow-500/30",
  dangerous: "bg-red-500/10 border-red-500/30",
};
const RATING_CARD: Record<string, string> = {
  "text-emerald-400": "bg-emerald-500/10 border-emerald-500/30",
  "text-sky-400":     "bg-sky-500/10 border-sky-500/30",
  "text-yellow-400":  "bg-yellow-500/10 border-yellow-500/30",
  "text-red-400":     "bg-red-500/10 border-red-500/30",
};

export default function DecisionWidget({
  profile, onProfileChange, currentWind, todayForecast, loading, spot,
}: DecisionWidgetProps) {

  const nowHour         = new Date().getHours();
  const forecastHourNow = todayForecast?.hours.find(h => h.time.getHours() === nowHour)
                        ?? todayForecast?.hours[0]
                        ?? null;

  const windSpeed = currentWind?.speed     ?? forecastHourNow?.windSpeed     ?? 0;
  const windDir   = currentWind?.direction ?? forecastHourNow?.windDirection ?? 180;
  const gustSpeed = currentWind?.gust      ?? forecastHourNow?.gustSpeed     ?? 0;

  const todayHours = todayForecast?.hours ?? [];
  const peakWind   = Math.max(...todayHours.map(h => h.windSpeed), windSpeed);

  const spotRules = useMemo(() => getSpotRules(spot.id), [spot.id]);
  const dirEval   = useMemo(
    () => spotRules ? evalDirection(windDir, spotRules) : null,
    [windDir, spotRules]
  );

  const hourEval = useMemo(() => {
    if (windSpeed <= 0) return null;
    const range = getRiderWindRange(profile);
    return evaluateHour(nowHour, windSpeed, windDir, gustSpeed, range, spotRules);
  }, [windSpeed, windDir, gustSpeed, profile, spotRules, nowHour]);

  const decision = useMemo(
    () => windSpeed > 0
      ? evaluateConditions({ windSpeed, windDirection: windDir, userProfile: profile })
      : null,
    [windSpeed, windDir, profile]
  );

  const cfg           = decision ? CONDITION_CONFIG[decision.condition] : null;
  const suggestedKite = getSuggestedKite(windSpeed, profile.weight);

  const ratingColor = hourEval ? RATING_COLOR[hourEval.rating] : (cfg?.color ?? "");
  const cardStyle   = RATING_CARD[ratingColor] ?? (cfg ? `${cfg.bg} ${cfg.border}` : "");

  return (
    <div className="space-y-4">

      {/* ══ PERFIL ══════════════════════════════════════════════ */}
      <div className="bg-gradient-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Mi perfil
        </h3>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Peso</label>
            <span className="text-sm font-bold text-primary">{profile.weight} kg</span>
          </div>
          <input type="range" min={50} max={120} step={5}
            value={profile.weight}
            onChange={e => onProfileChange({ ...profile, weight: Number(e.target.value) })}
            className="w-full accent-primary h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>50 kg</span><span>120 kg</span>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <label className="text-sm font-medium">Tamaño de kite</label>
          <div className="flex flex-wrap gap-1.5">
            {KITE_SIZES.map(size => (
              <button key={size}
                onClick={() => onProfileChange({ ...profile, kiteSize: size })}
                className={`px-2.5 py-1 rounded-lg text-sm font-medium transition-colors ${
                  profile.kiteSize === size
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {size}m²
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo de tabla</label>
          <div className="flex flex-wrap gap-1.5">
            {(["twintip", "directional", "foil"] as UserProfile["boardType"][]).map(type => (
              <button key={type}
                onClick={() => onProfileChange({ ...profile, boardType: type })}
                className={`px-2.5 py-1 rounded-lg text-sm font-medium transition-colors ${
                  profile.boardType === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {BOARD_LABELS[type]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ RESULTADO ═══════════════════════════════════════════ */}
      {loading ? (
        <div className="bg-gradient-card rounded-xl border border-border p-8 text-center">
          <div className="text-muted-foreground text-sm animate-pulse">Consultando viento real…</div>
        </div>
      ) : !decision || !cfg ? (
        <div className="bg-gradient-card rounded-xl border border-border p-6 text-center text-sm text-muted-foreground">
          Sin datos de viento para este spot en este momento.
        </div>
      ) : (
        <>
          {/* ── Condition card ───── */}
          <div className={`rounded-xl border p-5 ${cardStyle}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0 pr-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Condición ahora
                </p>
                <div className={`text-3xl font-bold ${ratingColor}`}>
                  {hourEval ? RATING_LABEL[hourEval.rating] : decision.label}
                </div>
                {hourEval && hourEval.reasons.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">{hourEval.reasons[0]}</p>
                )}
              </div>
              {hourEval && (
                <div className="shrink-0 text-center">
                  <div className={`text-3xl font-black leading-none ${ratingColor}`}>{hourEval.score}</div>
                  <div className="text-xs text-muted-foreground/60 mt-0.5">score</div>
                </div>
              )}
            </div>

            {/* Wind bar */}
            <div className="space-y-1">
              <div className="relative h-3 bg-secondary/60 rounded-full overflow-hidden">
                <div className="absolute h-full bg-emerald-500/25 rounded-full"
                  style={{
                    left:  `${Math.max(0, (decision.minWind / 40) * 100)}%`,
                    width: `${Math.max(0, ((decision.maxWind - decision.minWind) / 40) * 100)}%`,
                  }}
                />
                <div className={`absolute top-0 w-1 h-full ${cfg.barColor} rounded-full`}
                  style={{ left: `${Math.min(100, (windSpeed / 40) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 kn</span>
                <span className="text-emerald-400/80">Ideal: {decision.minWind}–{decision.maxWind} kn</span>
                <span>40 kn</span>
              </div>
            </div>
          </div>

          {/* ── Direction analysis ── */}
          {spotRules && dirEval && (
            <div className={`rounded-xl border p-4 flex items-center gap-3 ${DIR_QUALITY_CARD[dirEval.quality]}`}>
              <Compass className={`w-4 h-4 shrink-0 ${DIR_QUALITY_COLOR[dirEval.quality]}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold">
                    {directionName(windDir)} ({windDir}°)
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIR_QUALITY_BADGE[dirEval.quality]}`}>
                    {dirEval.quality === "ideal"      ? "Dirección ideal"
                     : dirEval.quality === "valid"    ? "Válida para el spot"
                     : dirEval.quality === "dangerous"? "⚠ Offshore / Peligroso"
                     : "Dirección desfavorable"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{dirEval.label}</p>
              </div>
            </div>
          )}

          {/* ── Stats ─────────────── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "kn ahora",    value: windSpeed, sub: currentWind ? "tiempo real" : "estimado",  color: "text-primary"    },
              { label: "kn pico hoy", value: peakWind,  sub: "pronóstico",                              color: "text-accent"     },
              { label: "kn ráfagas",  value: gustSpeed, sub: gustSpeed > 0 ? "máximas" : "sin datos",   color: "text-foreground" },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="bg-gradient-card rounded-xl border border-border p-3 text-center">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="text-xs text-muted-foreground/60 truncate">{sub}</div>
              </div>
            ))}
          </div>

          {/* ── Spot notes ────────── */}
          {spotRules?.notes && (
            <div className="bg-secondary/20 rounded-xl border border-border p-3 flex items-start gap-2">
              <Wind className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">{spotRules.notes}</p>
            </div>
          )}

          {/* ── Kite suggestion ───── */}
          <div className="bg-gradient-card rounded-xl border border-border p-4 flex items-start gap-3">
            <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
            <p className="text-sm">
              <span className="text-muted-foreground">Para {windSpeed} kn · {profile.weight} kg → </span>
              <span className="font-semibold text-foreground">kite óptimo {suggestedKite}m²</span>
              {suggestedKite !== profile.kiteSize && (
                <span className="text-muted-foreground"> (tenés {profile.kiteSize}m²)</span>
              )}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
