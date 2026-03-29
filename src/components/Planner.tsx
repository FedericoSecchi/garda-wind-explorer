import { useState, useMemo } from "react";
import { Calendar, Check, Clock, TrendingUp } from "lucide-react";
import { ForecastDay } from "@/data/forecast";
import { UserProfile } from "@/lib/windDecision";
import { ModelForecast } from "@/hooks/useForecast";
import { Spot } from "@/data/spots";
import { scoreDays, DayScore, LABEL_CONFIG, CONFIDENCE_CONFIG } from "@/lib/dayScore";
import { SailingWindow } from "@/lib/windowDetector";
import { useLanguage } from "@/hooks/useLanguage";

interface PlannerProps {
  profile:  UserProfile;
  forecast: ForecastDay[];
  spot:     Spot;
  models:   ModelForecast[];
}

// ── Sparkline ──────────────────────────────────────────────
function Sparkline({ day, score }: { day: ForecastDay; score: DayScore }) {
  const maxWind = Math.max(...day.hours.map(h => h.windSpeed), 1);
  return (
    <div className="hidden sm:flex items-end gap-px h-8">
      {day.hours.filter((_, i) => i % 2 === 0).map((h, i) => {
        const ev  = score.hourEvals.find(e => e.hour === h.time.getHours());
        const col = ev?.rating === "IDEAL"       ? "bg-emerald-400"
                  : ev?.rating === "GOOD"        ? "bg-sky-400"
                  : ev?.rating === "POSSIBLE"    ? "bg-yellow-400"
                  : "bg-red-400/40";
        return (
          <div key={i}
            className={`w-1.5 rounded-t ${col} opacity-70`}
            style={{ height: `${Math.max(10, (h.windSpeed / maxWind) * 100)}%` }}
          />
        );
      })}
    </div>
  );
}

// ── Answer card for today/tomorrow ─────────────────────────
function DayAnswer({
  day, score, label,
}: {
  day:   ForecastDay;
  score: DayScore;
  label: string;
}) {
  const { t } = useLanguage();
  const cfg   = LABEL_CONFIG[score.label];
  const ccfg  = CONFIDENCE_CONFIG[score.confidence];
  const best  = score.best as SailingWindow | null;

  return (
    <div className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`text-2xl font-bold ${cfg.color}`}>{cfg.icon}</div>
          {best && (
            <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{best.fromHour}:00 – {best.toHour}:00 h</span>
            </div>
          )}
          {!best && score.label !== "GO" && (
            <div className="text-xs text-muted-foreground mt-1">{t("planner.noWindow")}</div>
          )}
        </div>
        <div className="text-right shrink-0">
          <div className={`text-2xl font-bold ${cfg.color}`}>{score.score}</div>
          <div className="text-xs text-muted-foreground/60">/ 100</div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
        {best && (
          <div className="text-xs text-muted-foreground">
            {best.hours}h · pico {best.peakKn} kn
          </div>
        )}
        <div className={`text-xs font-medium ${ccfg.color} ml-auto`}>
          {ccfg.label}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────
export default function Planner({ profile, forecast, spot, models }: PlannerProps) {
  const { t } = useLanguage();
  const [availableDays, setAvailableDays] = useState<Set<number>>(new Set());

  function toggleDay(idx: number) {
    setAvailableDays(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }

  // Compute full day scores (memoized)
  const dayScores: DayScore[] = useMemo(
    () => scoreDays(forecast, profile, spot.id, models),
    [forecast, profile, spot.id, models]
  );

  const today    = forecast[0] ? { day: forecast[0], score: dayScores[0]! } : null;
  const tomorrow = forecast[1] ? { day: forecast[1], score: dayScores[1]! } : null;

  const recommendedDays = forecast
    .map((day, idx) => ({ day, idx, score: dayScores[idx]! }))
    .filter(({ idx, score }) => availableDays.has(idx) && score.label !== "NO GO");

  return (
    <div className="space-y-4">

      {/* ── Today / Tomorrow answer cards ─────────────── */}
      {(today || tomorrow) && (
        <div className="grid sm:grid-cols-2 gap-3">
          {today    && <DayAnswer day={today.day}    score={today.score}    label={t("planner.today")}    />}
          {tomorrow && <DayAnswer day={tomorrow.day} score={tomorrow.score} label={t("planner.tomorrow")} />}
        </div>
      )}

      {/* ── Weekly selector ──────────────────────────── */}
      <div className="flex items-center gap-2 pt-1">
        <Calendar className="w-5 h-5 text-primary" />
        <div>
          <h3 className="font-semibold">{t("planner.title")}</h3>
          <p className="text-xs text-muted-foreground">{t("planner.subtitle")}</p>
        </div>
      </div>

      <div className="space-y-2">
        {forecast.map((day, idx) => {
          const score       = dayScores[idx]!;
          const cfg         = LABEL_CONFIG[score.label];
          const ccfg        = CONFIDENCE_CONFIG[score.confidence];
          const isAvailable = availableDays.has(idx);
          const best        = score.best as SailingWindow | null;

          return (
            <div
              key={idx}
              onClick={() => toggleDay(idx)}
              className={`
                rounded-xl border p-4 cursor-pointer transition-all select-none
                ${isAvailable
                  ? `${cfg.bg} ${cfg.border}`
                  : "bg-gradient-card border-border hover:border-muted/60"}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                    isAvailable ? "bg-primary" : "bg-secondary border border-muted"
                  }`}>
                    {isAvailable && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>

                  <div>
                    <div className={`font-semibold text-sm ${!isAvailable ? "text-muted-foreground" : ""}`}>
                      {day.dayLabel}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {day.date.toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Sparkline day={day} score={score} />

                  <div className="text-right min-w-[90px]">
                    {/* GO / MAYBE / NO GO label */}
                    <div className="flex items-center justify-end gap-1.5">
                      <span className={`text-sm font-bold ${cfg.color}`}>{score.label}</span>
                      <span className={`text-[10px] font-medium ${ccfg.color}`}>
                        {score.confidence}
                      </span>
                    </div>
                    {/* Score + best window */}
                    <div className="text-xs text-muted-foreground">
                      <TrendingUp className="w-3 h-3 inline mr-0.5" />
                      {score.score}/100
                      {best && (
                        <span className="ml-1 opacity-70">· {best.fromHour}:00–{best.toHour}:00</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Recommendation ─────────────────────────── */}
      {availableDays.size > 0 && (
        <div className="bg-gradient-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
            {t("planner.reco")}
          </p>
          {recommendedDays.length > 0 ? (
            <div className="space-y-2">
              {recommendedDays.map(({ day, score }) => {
                const cfg  = LABEL_CONFIG[score.label];
                const best = score.best as SailingWindow | null;
                return (
                  <div key={day.dayLabel} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <span className="font-semibold">{day.dayLabel}</span>
                      <span className={`ml-1.5 text-xs font-bold ${cfg.color}`}>{score.label}</span>
                      <span className="text-muted-foreground">
                        {" — "}
                        {best
                          ? `${best.fromHour}:00–${best.toHour}:00 · ${best.peakKn} kn pico`
                          : `pico ${day.maxWind} kn`}
                        {" · "}{score.score}/100
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("planner.noWind")} {profile.kiteSize}m².
            </p>
          )}
        </div>
      )}

      {availableDays.size === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          {t("planner.selectDays")}
        </p>
      )}
    </div>
  );
}
