// Muestra el pronóstico de cada modelo para la hora actual
// y un consenso de confianza.

import { useMemo } from "react";
import { ModelForecast } from "@/hooks/useForecast";
import { UserProfile, evaluateConditions, SailingCondition, CONDITION_CONFIG } from "@/lib/windDecision";
import { BarChart2, AlertCircle } from "lucide-react";

interface ModelComparisonProps {
  models:  ModelForecast[];
  profile: UserProfile;
  loading: boolean;
}

function currentHourWind(model: ModelForecast): { speed: number; direction: number } | null {
  if (!model.available || model.forecast.length === 0) return null;
  const now = new Date();
  const todayHours = model.forecast[0]?.hours ?? [];
  const hour = todayHours.find((h) => h.time.getHours() === now.getHours())
    ?? todayHours.find((h) => h.time.getHours() >= now.getHours())
    ?? todayHours[0];
  return hour ? { speed: hour.windSpeed, direction: hour.windDirection } : null;
}

const CONDITION_LABEL: Record<SailingCondition, string> = {
  ideal:              "Ideal",
  condiciones_medias: "Puede servir",
  no_navegable:       "No navegable",
};

export default function ModelComparison({ models, profile, loading }: ModelComparisonProps) {
  const evaluations = useMemo(() =>
    models.map((model) => {
      const wind = currentHourWind(model);
      if (!wind) return { model, wind: null, decision: null };
      const decision = evaluateConditions({ windSpeed: wind.speed, windDirection: wind.direction, userProfile: profile });
      return { model, wind, decision };
    }),
    [models, profile]
  );

  const available = evaluations.filter((e) => e.decision !== null);
  const idealCount  = available.filter((e) => e.decision?.condition === "ideal").length;
  const mediumCount = available.filter((e) => e.decision?.condition === "condiciones_medias").length;
  const noCount     = available.filter((e) => e.decision?.condition === "no_navegable").length;

  // Consenso: la condición más votada
  const consensus: SailingCondition | null = available.length === 0 ? null :
    idealCount  >= available.length / 2 ? "ideal" :
    mediumCount >= available.length / 2 ? "condiciones_medias" :
    noCount     >= available.length / 2 ? "no_navegable" : "condiciones_medias";

  const confidence = available.length === 0 ? 0 :
    consensus === "ideal"  ? idealCount  / available.length :
    consensus === "no_navegable" ? noCount / available.length :
    mediumCount / available.length;

  const cfgConsensus = consensus ? CONDITION_CONFIG[consensus] : null;

  return (
    <div className="bg-gradient-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Comparación de modelos meteorológicos</span>
        {loading && <span className="text-xs text-muted-foreground ml-auto animate-pulse">Cargando…</span>}
      </div>

      {/* Filas por modelo */}
      <div className="divide-y divide-border">
        {evaluations.map(({ model, wind, decision }) => {
          const cfg = decision ? CONDITION_CONFIG[decision.condition] : null;
          return (
            <div key={model.key} className="px-4 py-3 flex items-center gap-3">
              {/* Nombre */}
              <div className="w-32 shrink-0">
                <div className="text-sm font-semibold">{model.label}</div>
                <div className="text-xs text-muted-foreground">{model.sublabel}</div>
              </div>

              {/* Viento */}
              <div className="w-20 shrink-0 text-center">
                {wind ? (
                  <>
                    <div className="text-lg font-bold text-foreground">{wind.speed}</div>
                    <div className="text-xs text-muted-foreground">kn</div>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground">—</div>
                )}
              </div>

              {/* Condición */}
              <div className="flex-1">
                {!model.available ? (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Sin datos
                  </div>
                ) : cfg && decision ? (
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                    <span>{cfg.icon}</span>
                    {CONDITION_LABEL[decision.condition]}
                  </div>
                ) : null}
              </div>

              {/* Barra de viento mini */}
              {wind && decision && (
                <div className="hidden sm:block w-24 shrink-0">
                  <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="absolute h-full bg-emerald-500/25 rounded-full"
                      style={{
                        left:  `${Math.max(0, (decision.minWind / 35) * 100)}%`,
                        width: `${Math.max(0, ((decision.maxWind - decision.minWind) / 35) * 100)}%`,
                      }}
                    />
                    <div
                      className={`absolute top-0 w-0.5 h-full ${cfg?.barColor ?? "bg-primary"}`}
                      style={{ left: `${Math.min(100, (wind.speed / 35) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Consenso */}
      {available.length > 0 && cfgConsensus && consensus && (
        <div className={`px-4 py-3 border-t border-border ${cfgConsensus.bg} flex items-center justify-between`}>
          <div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Consenso </span>
            <span className={`text-sm font-bold ${cfgConsensus.color}`}>
              {CONDITION_LABEL[consensus]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {evaluations.map(({ model, decision }) => (
                <div
                  key={model.key}
                  className={`w-2 h-2 rounded-full ${
                    !model.available ? "bg-muted" :
                    decision?.condition === "ideal" ? "bg-emerald-400" :
                    decision?.condition === "condiciones_medias" ? "bg-yellow-400" :
                    "bg-red-400"
                  }`}
                  title={model.label}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {Math.round(confidence * 100)}% confianza
              {available.length < models.length && ` (${available.length}/${models.length} modelos)`}
            </span>
          </div>
        </div>
      )}

      {available.length === 0 && !loading && (
        <div className="px-4 py-4 text-center text-sm text-muted-foreground">
          <AlertCircle className="w-5 h-5 mx-auto mb-2 opacity-50" />
          No hay datos de pronóstico para este spot en este momento.
        </div>
      )}
    </div>
  );
}
