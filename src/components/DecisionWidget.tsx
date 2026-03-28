// ============================================================
// WIDGET DE DECISIÓN
// ============================================================
// Muestra si las condiciones actuales son aptas para navegar,
// basándose en el perfil del usuario y el viento en tiempo real.
// ============================================================

import { useState } from "react";
import { Wind, User, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { UserProfile, evaluateConditions, CONDITION_CONFIG, getSuggestedKite } from "@/lib/windDecision";
import { mockStations } from "@/data/stations";

interface DecisionWidgetProps {
  profile: UserProfile;
  onProfileChange: (p: UserProfile) => void;
}

const KITE_SIZES = [7, 9, 10, 12, 14, 15, 17];
const BOARD_LABELS: Record<UserProfile["boardType"], string> = {
  twintip: "Twin Tip",
  directional: "Direccional",
  foil: "Foil",
};

export default function DecisionWidget({ profile, onProfileChange }: DecisionWidgetProps) {
  const [showProfile, setShowProfile] = useState(false);

  // Usamos el viento promedio de las estaciones activas como "viento actual"
  const avgWind = Math.round(
    mockStations.reduce((acc, s) => acc + s.windSpeed, 0) / mockStations.length
  );
  const maxWind = Math.max(...mockStations.map((s) => s.windSpeed));
  const bestStation = mockStations.reduce((best, s) =>
    s.windSpeed > best.windSpeed ? s : best
  );

  const decision = evaluateConditions({
    windSpeed: maxWind,
    windDirection: bestStation.windDirection,
    userProfile: profile,
  });

  const cfg = CONDITION_CONFIG[decision.condition];

  return (
    <div className="space-y-4">
      {/* ── Resultado principal ─────────────────────────── */}
      <div className={`rounded-xl border p-6 shadow-card ${cfg.bg} ${cfg.border}`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Condición actual en Garda
            </p>
            <div className={`text-3xl font-bold ${cfg.color}`}>{decision.label}</div>
          </div>
          <div className={`text-4xl font-mono font-black ${cfg.color}`}>
            {cfg.icon}
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{decision.explanation}</p>

        {/* Barra de viento */}
        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 kn</span>
            <span className="font-medium">Viento actual: {maxWind} kn (mejor spot)</span>
            <span>35+ kn</span>
          </div>
          <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
            {/* Zona ideal */}
            <div
              className="absolute h-full bg-emerald-500/30 rounded-full"
              style={{
                left: `${(decision.minWind / 35) * 100}%`,
                width: `${((decision.maxWind - decision.minWind) / 35) * 100}%`,
              }}
            />
            {/* Indicador actual */}
            <div
              className={`absolute top-0 w-1 h-full ${cfg.color.replace("text-", "bg-")} rounded-full transition-all`}
              style={{ left: `${Math.min((maxWind / 35) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-emerald-400/70">
              Rango ideal: {decision.minWind}–{decision.maxWind} kn
            </span>
          </div>
        </div>
      </div>

      {/* ── Sugerencia de kite ──────────────────────────── */}
      <div className="bg-gradient-card rounded-xl border border-border p-4 flex items-start gap-3">
        <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
        <div className="text-sm">
          <span className="text-muted-foreground">Para {maxWind} kn con tu peso ({profile.weight} kg), </span>
          <span className="font-semibold text-foreground">
            el kite óptimo es {getSuggestedKite(maxWind, profile.weight)}m²
          </span>
          {getSuggestedKite(maxWind, profile.weight) !== profile.kiteSize && (
            <span className="text-muted-foreground"> (tenés {profile.kiteSize}m²)</span>
          )}
        </div>
      </div>

      {/* ── Resumen de estaciones ───────────────────────── */}
      <div className="bg-gradient-card rounded-xl border border-border p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
          Viento en el lago ahora
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{maxWind}</div>
            <div className="text-xs text-muted-foreground">kn máximo</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">{avgWind}</div>
            <div className="text-xs text-muted-foreground">kn promedio</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {mockStations.filter((s) => s.windSpeed >= decision.minWind).length}
            </div>
            <div className="text-xs text-muted-foreground">spots ok</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Mejor spot: <span className="text-foreground font-medium">{bestStation.name}</span>
          {" "}({bestStation.windSpeed} kn)
        </p>
      </div>

      {/* ── Perfil del usuario (colapsable) ─────────────── */}
      <div className="bg-gradient-card rounded-xl border border-border overflow-hidden">
        <button
          className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
          onClick={() => setShowProfile((v) => !v)}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <User className="w-4 h-4 text-primary" />
            Mi perfil de rider
          </div>
          {showProfile ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {showProfile && (
          <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
            {/* Peso */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">
                Peso: {profile.weight} kg
              </label>
              <input
                type="range"
                min={50}
                max={120}
                step={5}
                value={profile.weight}
                onChange={(e) =>
                  onProfileChange({ ...profile, weight: Number(e.target.value) })
                }
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>50 kg</span>
                <span>120 kg</span>
              </div>
            </div>

            {/* Kite */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">
                Tamaño de kite
              </label>
              <div className="flex flex-wrap gap-2">
                {KITE_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => onProfileChange({ ...profile, kiteSize: size })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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
              <label className="text-xs text-muted-foreground uppercase tracking-wider">
                Tipo de tabla
              </label>
              <div className="flex flex-wrap gap-2">
                {(["twintip", "directional", "foil"] as UserProfile["boardType"][]).map(
                  (type) => (
                    <button
                      key={type}
                      onClick={() => onProfileChange({ ...profile, boardType: type })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        profile.boardType === type
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {BOARD_LABELS[type]}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
