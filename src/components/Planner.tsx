import { useState, useMemo } from "react";
import { Calendar, Wind, Check, X, Minus } from "lucide-react";
import { ForecastDay } from "@/data/forecast";
import {
  UserProfile,
  evaluateConditions,
  SailingCondition,
  CONDITION_CONFIG,
} from "@/lib/windDecision";

interface PlannerProps {
  profile:  UserProfile;
  forecast: ForecastDay[];
}

const CONDITION_LABELS: Record<SailingCondition, string> = {
  ideal: "Navegable",
  condiciones_medias: "Puede servir",
  no_navegable: "No vale la pena",
};

const CONDITION_ICONS: Record<SailingCondition, typeof Check> = {
  ideal: Check,
  condiciones_medias: Minus,
  no_navegable: X,
};

export default function Planner({ profile, forecast }: PlannerProps) {
  const [availableDays, setAvailableDays] = useState<Set<number>>(new Set());

  function toggleDay(idx: number) {
    setAvailableDays((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }

  // Memoizado: recalcular solo cuando cambia el perfil o el pronóstico
  const planDays = useMemo(() =>
    forecast.map((day, idx) => {
      const peakHour = day.hours.find((h) => h.time.getHours() === day.peakHour) ?? day.hours[0];
      const decision = evaluateConditions({
        windSpeed: peakHour.windSpeed,
        windDirection: peakHour.windDirection,
        userProfile: profile,
      });
      const navigableHours = day.hours.filter((h) => {
        const d = evaluateConditions({ windSpeed: h.windSpeed, windDirection: h.windDirection, userProfile: profile });
        return d.condition === "ideal";
      }).length;
      return { day, idx, decision, navigableHours };
    }),
    [profile, forecast]
  );

  const recommendedDays = planDays.filter(
    (d) => availableDays.has(d.idx) && d.decision.condition !== "no_navegable"
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-primary" />
        <div>
          <h3 className="font-semibold">Planificador semanal</h3>
          <p className="text-xs text-muted-foreground">
            Marcá los días que podés salir y te digo cuándo vale la pena.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {planDays.map(({ day, idx, decision, navigableHours }) => {
          const isAvailable = availableDays.has(idx);
          const cfg = CONDITION_CONFIG[decision.condition];
          const Icon = CONDITION_ICONS[decision.condition];
          const maxBarWind = Math.max(...day.hours.map((h) => h.windSpeed), 1);

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
                  {/* Sparkline con color por barra según condición */}
                  <div className="hidden sm:flex items-end gap-px h-8">
                    {day.hours.filter((_, i) => i % 2 === 0).map((h, i) => {
                      const d = evaluateConditions({ windSpeed: h.windSpeed, windDirection: h.windDirection, userProfile: profile });
                      const barCfg = CONDITION_CONFIG[d.condition];
                      return (
                        <div
                          key={i}
                          className={`w-1.5 rounded-t ${barCfg.barColor} ${isAvailable ? "opacity-70" : "opacity-30"}`}
                          style={{ height: `${Math.max(10, (h.windSpeed / maxBarWind) * 100)}%` }}
                        />
                      );
                    })}
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                      <span className={`text-sm font-semibold ${cfg.color}`}>
                        {CONDITION_LABELS[decision.condition]}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <Wind className="w-3 h-3 inline mr-0.5" />
                      pico {day.maxWind} kn
                      {navigableHours > 0 && (
                        <span className="ml-1">· {navigableHours}h ideales</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recomendación */}
      {availableDays.size > 0 && (
        <div className="bg-gradient-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
            Mi recomendación
          </p>
          {recommendedDays.length > 0 ? (
            <div className="space-y-2">
              {recommendedDays.map(({ day, decision, navigableHours }) => (
                <div key={day.dayLabel} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <span className="font-semibold">{day.dayLabel}</span>
                    <span className="text-muted-foreground">
                      {" — "}
                      {decision.condition === "ideal"
                        ? `Salí, pico de ${day.maxWind} kn${navigableHours > 0 ? `, ${navigableHours}h ideales` : ""}`
                        : `Puede servir, pico de ${day.maxWind} kn`}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Ninguno de tus días tiene condiciones suficientes con tu {profile.kiteSize}m².
            </p>
          )}
        </div>
      )}

      {availableDays.size === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Tocá los días para marcar tu disponibilidad.
        </p>
      )}
    </div>
  );
}
