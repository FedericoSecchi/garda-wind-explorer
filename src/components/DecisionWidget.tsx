// ¿Navego? — Perfil arriba, resultados abajo
// El usuario configura su equipo → la app decide en tiempo real

import { useMemo } from "react";
import { Lightbulb } from "lucide-react";
import {
  UserProfile,
  evaluateConditions,
  CONDITION_CONFIG,
  getSuggestedKite,
} from "@/lib/windDecision";
import { WindStation } from "@/data/stations";
import { ForecastDay } from "@/data/forecast";

interface DecisionWidgetProps {
  profile:         UserProfile;
  onProfileChange: (p: UserProfile) => void;
  stations:        WindStation[];
  todayForecast:   ForecastDay | null;
  loading:         boolean;
}

const KITE_SIZES = [7, 9, 10, 12, 14, 15, 17];
const BOARD_LABELS: Record<UserProfile["boardType"], string> = {
  twintip:     "Twin Tip",
  directional: "Direccional",
  foil:        "Foil",
};

export default function DecisionWidget({ profile, onProfileChange, stations, todayForecast, loading }: DecisionWidgetProps) {
  const maxWind = stations.length ? Math.max(...stations.map((s) => s.windSpeed)) : 0;
  const avgWind = stations.length ? Math.round(stations.reduce((a, s) => a + s.windSpeed, 0) / stations.length) : 0;
  const bestStation = stations.length
    ? stations.reduce((best, s) => s.windSpeed > best.windSpeed ? s : best)
    : null;

  const decision = useMemo(
    () => bestStation
      ? evaluateConditions({ windSpeed: maxWind, windDirection: bestStation.windDirection, userProfile: profile })
      : null,
    [maxWind, bestStation, profile]
  );

  const cfg = decision ? CONDITION_CONFIG[decision.condition] : null;

  const todayHours      = todayForecast?.hours ?? [];
  const maxForecastWind = Math.max(...todayHours.map((h) => h.windSpeed), 1);
  const suggestedKite   = getSuggestedKite(maxWind, profile.weight);

  return (
    <div className="space-y-4">

      {/* ══════════════════════════════════════════════════
          SECCIÓN 1 — PERFIL DEL RIDER (siempre arriba)
      ══════════════════════════════════════════════════ */}
      <div className="bg-gradient-card rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Mi perfil
        </h3>

        {/* Peso */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Peso</label>
            <span className="text-sm font-bold text-primary">{profile.weight} kg</span>
          </div>
          <input
            type="range" min={50} max={120} step={5}
            value={profile.weight}
            onChange={(e) => onProfileChange({ ...profile, weight: Number(e.target.value) })}
            className="w-full accent-primary h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>50 kg</span><span>120 kg</span>
          </div>
        </div>

        {/* Kite */}
        <div className="space-y-2 mb-4">
          <label className="text-sm font-medium">Tamaño de kite</label>
          <div className="flex flex-wrap gap-1.5">
            {KITE_SIZES.map((size) => (
              <button
                key={size}
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

        {/* Tabla */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo de tabla</label>
          <div className="flex flex-wrap gap-1.5">
            {(["twintip", "directional", "foil"] as UserProfile["boardType"][]).map((type) => (
              <button
                key={type}
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

      {/* ══════════════════════════════════════════════════
          SECCIÓN 2 — RESULTADO PRINCIPAL
      ══════════════════════════════════════════════════ */}
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
          <div className={`rounded-xl border p-5 ${cfg.bg} ${cfg.border}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Condición ahora
                </p>
                <div className={`text-3xl font-bold ${cfg.color}`}>{decision.label}</div>
              </div>
              <div className={`text-5xl font-black ${cfg.color} leading-none`}>
                {cfg.icon}
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">{decision.explanation}</p>

            {/* Barra de viento */}
            <div className="space-y-1">
              <div className="relative h-3 bg-secondary/60 rounded-full overflow-hidden">
                <div
                  className="absolute h-full bg-emerald-500/25 rounded-full"
                  style={{
                    left:  `${Math.max(0, (decision.minWind / 35) * 100)}%`,
                    width: `${Math.max(0, ((decision.maxWind - decision.minWind) / 35) * 100)}%`,
                  }}
                />
                <div
                  className={`absolute top-0 w-1 h-full ${cfg.barColor} rounded-full`}
                  style={{ left: `${Math.min(100, (maxWind / 35) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 kn</span>
                <span className="text-emerald-400/80">Ideal: {decision.minWind}–{decision.maxWind} kn</span>
                <span>35 kn</span>
              </div>
            </div>
          </div>

          {/* Stats del lago */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "kn máx", value: maxWind, sub: bestStation?.name.split(" ")[0] ?? "", color: "text-primary" },
              { label: "kn prom", value: avgWind, sub: `${stations.length} spots`, color: "text-accent" },
              { label: "spots ok", value: stations.filter((s) => s.windSpeed >= decision.minWind).length, sub: `≥${decision.minWind} kn`, color: "text-foreground" },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="bg-gradient-card rounded-xl border border-border p-3 text-center">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="text-xs text-muted-foreground/60 truncate">{sub}</div>
              </div>
            ))}
          </div>

          {/* Gráfico horario hoy */}
          {todayHours.length > 0 && (
            <div className="bg-gradient-card rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                Pronóstico de hoy — hora a hora
              </p>
              <div className="flex items-end gap-1 h-14">
                {todayHours.map((h, i) => {
                  const d      = evaluateConditions({ windSpeed: h.windSpeed, windDirection: h.windDirection, userProfile: profile });
                  const barCfg = CONDITION_CONFIG[d.condition];
                  const pct    = Math.max(8, (h.windSpeed / maxForecastWind) * 100);
                  const isPast = h.time < new Date();
                  return (
                    <div key={i} className="flex-1">
                      <div
                        className={`w-full rounded-t ${barCfg.barColor} ${isPast ? "opacity-25" : "opacity-80"}`}
                        style={{ height: `${pct}%` }}
                        title={`${h.time.getHours()}:00 · ${h.windSpeed} kn`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{todayHours[0]?.time.getHours()}:00</span>
                <span>Pico: {Math.max(...todayHours.map((h) => h.windSpeed))} kn</span>
                <span>{todayHours[todayHours.length - 1]?.time.getHours()}:00</span>
              </div>
            </div>
          )}

          {/* Sugerencia de kite */}
          <div className="bg-gradient-card rounded-xl border border-border p-4 flex items-start gap-3">
            <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
            <p className="text-sm">
              <span className="text-muted-foreground">Para {maxWind} kn · {profile.weight} kg → </span>
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
