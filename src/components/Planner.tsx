// ============================================================
// PLANIFICADOR SEMANAL
// ============================================================
// Input: días disponibles del usuario
// Output: "Este día es navegable" / "No vale la pena"
// ============================================================

import { useState } from "react";
import { Calendar, Wind, Check, X, Minus } from "lucide-react";
import { mockForecast } from "@/data/forecast";
import { UserProfile, evaluateConditions, SailingCondition, CONDITION_CONFIG } from "@/lib/windDecision";

interface PlannerProps {
  profile: UserProfile;
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

export default function Planner({ profile }: PlannerProps) {
  // Set de días marcados como disponibles por el usuario
  const [availableDays, setAvailableDays] = useState<Set<number>>(new Set());

  function toggleDay(idx: number) {
    setAvailableDays((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  // Para cada día del pronóstico, calcular la condición máxima
  const planDays = mockForecast.map((day, idx) => {
    // Evaluar la hora pico
    const peakHour = day.hours.find((h) => h.time.getHours() === day.peakHour) ?? day.hours[0];
    const decision = evaluateConditions({
      windSpeed: peakHour.windSpeed,
      windDirection: peakHour.windDirection,
      userProfile: profile,
    });

    // Contar horas navegables
    const navigableHours = day.hours.filter((h) => {
      const d = evaluateConditions({
        windSpeed: h.windSpeed,
        windDirection: h.windDirection,
        userProfile: profile,
      });
      return d.condition === "ideal";
    }).length;

    return {
      day,
      idx,
      decision,
      navigableHours,
      isAvailable: availableDays.has(idx),
    };
  });

  const recommendedDays = planDays.filter(
    (d) => d.isAvailable && d.decision.condition !== "no_navegable"
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

      {/* ── Grilla de días ──────────────────────────────── */}
      <div className="space-y-2">
        {planDays.map(({ day, idx, decision, navigableHours, isAvailable }) => {
          const cfg = CONDITION_CONFIG[decision.condition];
          const Icon = CONDITION_ICONS[decision.condition];

          return (
            <div
              key={idx}
              onClick={() => toggleDay(idx)}
              className={`
                relative rounded-xl border p-4 cursor-pointer transition-all
                ${isAvailable
                  ? `${cfg.bg} ${cfg.border}`
                  : "bg-gradient-card border-border hover:border-muted opacity-60"}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Checkbox visual */}
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                      isAvailable ? "bg-primary" : "bg-secondary border border-muted"
                    }`}
                  >
                    {isAvailable && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>

                  <div>
                    <div className="font-semibold text-sm">{day.dayLabel}</div>
                    <div className="text-xs text-muted-foreground">
                      {day.date.toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </div>
                  </div>
                </div>

                {/* Condición */}
                <div className="flex items-center gap-3">
                  {/* Sparkline de viento */}
                  <div className="hidden sm:flex items-end gap-0.5 h-8">
                    {day.hours
                      .filter((_, i) => i % 2 === 0)
                      .map((h, i) => (
                        <div
                          key={i}
                          className="w-1.5 rounded-t transition-all"
                          style={{
                            height: `${Math.max(4, (h.windSpeed / 35) * 32)}px`,
                            backgroundColor:
                              decision.condition === "ideal"
                                ? "rgb(52 211 153 / 0.6)"
                                : decision.condition === "condiciones_medias"
                                ? "rgb(251 191 36 / 0.6)"
                                : "rgb(148 163 184 / 0.3)",
                          }}
                        />
                      ))}
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                      <span className={`text-sm font-semibold ${cfg.color}`}>
                        {CONDITION_LABELS[decision.condition]}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <Wind className="w-3 h-3 inline mr-1" />
                      Pico {day.maxWind} kn
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

      {/* ── Recomendación final ─────────────────────────── */}
      {availableDays.size > 0 && (
        <div className="bg-gradient-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
            Recomendación para tus días disponibles
          </p>
          {recommendedDays.length > 0 ? (
            <div className="space-y-2">
              {recommendedDays.map(({ day, decision, navigableHours }) => (
                <div key={day.dayLabel} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <span className="font-semibold">{day.dayLabel}</span>
                    {" — "}
                    <span className="text-muted-foreground">
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
              Ninguno de tus días disponibles tiene condiciones suficientes con tu{" "}
              {profile.kiteSize}m².
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
