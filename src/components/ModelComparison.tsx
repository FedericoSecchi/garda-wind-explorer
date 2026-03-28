// Muestra el pronóstico de cada modelo para la hora actual,
// un consenso de confianza, y links directos para verificar los datos.

import { useMemo } from "react";
import { ExternalLink, BarChart2, AlertCircle } from "lucide-react";
import { ModelForecast, MODELS, buildVerifyUrl } from "@/hooks/useForecast";
import { UserProfile, evaluateConditions, SailingCondition, CONDITION_CONFIG } from "@/lib/windDecision";
import { Spot } from "@/data/spots";

interface ModelComparisonProps {
  models:  ModelForecast[];
  profile: UserProfile;
  loading: boolean;
  spot:    Spot;
}

// URL de Windy centrada en el spot para cada modelo
function windyUrl(lat: number, lng: number, model: "gfs" | "ecmwf" | "icon"): string {
  const windy = { gfs: "gfs", ecmwf: "ecmwf", icon: "icon" }[model];
  return `https://www.windy.com/?wind,${lat.toFixed(2)},${lng.toFixed(2)},10,m:${windy}`;
}

function currentHourWind(model: ModelForecast): { speed: number; direction: number } | null {
  if (!model.available || model.forecast.length === 0) return null;
  const now  = new Date();
  const hours = model.forecast[0]?.hours ?? [];
  const hour  = hours.find((h) => h.time.getHours() === now.getHours())
             ?? hours.find((h) => h.time.getHours() >= now.getHours())
             ?? hours[0];
  return hour ? { speed: hour.windSpeed, direction: hour.windDirection } : null;
}

const CONDITION_LABEL: Record<SailingCondition, string> = {
  ideal:              "Ideal",
  condiciones_medias: "Puede servir",
  no_navegable:       "No navegable",
};

// Param de Open-Meteo por key de modelo
const MODEL_PARAMS: Record<string, string> = {
  gfs:   "gfs_seamless",
  ecmwf: "ecmwf_ifs025",
  icon:  "icon_seamless",
};

export default function ModelComparison({ models, profile, loading, spot }: ModelComparisonProps) {
  const evaluations = useMemo(() =>
    models.map((model) => {
      const wind = currentHourWind(model);
      if (!wind) return { model, wind: null, decision: null };
      const decision = evaluateConditions({ windSpeed: wind.speed, windDirection: wind.direction, userProfile: profile });
      return { model, wind, decision };
    }),
    [models, profile]
  );

  const available    = evaluations.filter((e) => e.decision !== null);
  const idealCount   = available.filter((e) => e.decision?.condition === "ideal").length;
  const mediumCount  = available.filter((e) => e.decision?.condition === "condiciones_medias").length;
  const noCount      = available.filter((e) => e.decision?.condition === "no_navegable").length;

  const consensus: SailingCondition | null = available.length === 0 ? null :
    idealCount  >= available.length / 2 ? "ideal" :
    mediumCount >= available.length / 2 ? "condiciones_medias" :
    noCount     >= available.length / 2 ? "no_navegable" : "condiciones_medias";

  const confidence = available.length === 0 ? 0 :
    consensus === "ideal"        ? idealCount  / available.length :
    consensus === "no_navegable" ? noCount     / available.length :
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
          const cfg        = decision ? CONDITION_CONFIG[decision.condition] : null;
          const modelParam = MODEL_PARAMS[model.key] ?? "gfs_seamless";
          const apiUrl     = buildVerifyUrl(spot.lat, spot.lng, modelParam);
          const wUrl       = windyUrl(spot.lat, spot.lng, model.key);

          return (
            <div key={model.key} className="px-4 py-3">
              <div className="flex items-center gap-3">
                {/* Nombre + links */}
                <div className="w-32 shrink-0">
                  <div className="text-sm font-semibold">{model.label}</div>
                  <div className="text-xs text-muted-foreground">{model.sublabel}</div>
                </div>

                {/* Viento */}
                <div className="w-16 shrink-0 text-center">
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
                <div className="flex-1 min-w-0">
                  {!model.available ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Sin datos
                    </div>
                  ) : cfg && decision ? (
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                      <span>{cfg.icon}</span>
                      {CONDITION_LABEL[decision.condition]}
                    </div>
                  ) : null}
                </div>

                {/* Barra mini */}
                {wind && decision && (
                  <div className="hidden sm:block w-20 shrink-0">
                    <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="absolute h-full bg-emerald-500/25 rounded-full"
                        style={{
                          left:  `${Math.max(0, (decision.minWind / 40) * 100)}%`,
                          width: `${Math.max(0, ((decision.maxWind - decision.minWind) / 40) * 100)}%`,
                        }}
                      />
                      <div
                        className={`absolute top-0 w-0.5 h-full ${cfg?.barColor ?? "bg-primary"}`}
                        style={{ left: `${Math.min(100, (wind.speed / 40) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Links de verificación */}
              <div className="flex gap-3 mt-1.5 ml-32 pl-3">
                <a
                  href={apiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open-Meteo
                </a>
                <a
                  href={wUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Windy
                </a>
                {model.key === "gfs" && spot.windguruId && (
                  <a
                    href={`https://www.windguru.cz/${spot.windguruId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Windguru
                  </a>
                )}
              </div>
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
                    !model.available           ? "bg-muted" :
                    decision?.condition === "ideal"              ? "bg-emerald-400" :
                    decision?.condition === "condiciones_medias" ? "bg-yellow-400"  : "bg-red-400"
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
          No hay datos de pronóstico disponibles. Verificá tu conexión.
        </div>
      )}
    </div>
  );
}
