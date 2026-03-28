import { useState, useMemo } from "react";
import { User, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
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
}

const KITE_SIZES = [7, 9, 10, 12, 14, 15, 17];
const BOARD_LABELS: Record<UserProfile["boardType"], string> = {
  twintip:      "Twin Tip",
  directional:  "Direccional",
  foil:         "Foil",
};

export default function DecisionWidget({ profile, onProfileChange, stations, todayForecast }: DecisionWidgetProps) {
  const [showProfile, setShowProfile] = useState(false);

  const maxWind    = stations.length ? Math.max(...stations.map((s) => s.windSpeed)) : 0;
  const avgWind    = stations.length ? Math.round(stations.reduce((a, s) => a + s.windSpeed, 0) / stations.length) : 0;
  const bestStation = stations.reduce((best, s) => s.windSpeed > best.windSpeed ? s : best, stations[0]);

  const decision = useMemo(
    () => bestStation
      ? evaluateConditions({ windSpeed: maxWind, windDirection: bestStation.windDirection, userProfile: profile })
      : null,
    [maxWind, bestStation, profile]
  );

  if (!decision || !bestStation) return null;

  const cfg = CONDITION_CONFIG[decision.condition];

  const todayHours    = todayForecast?.hours ?? [];
  const maxForecastWind = Math.max(...todayHours.map((h) => h.windSpeed), 1);

  const barMin     = Math.max(0, Math.min(100, (decision.minWind / 35) * 100));
  const barWidth   = Math.max(0, Math.min(100 - barMin, ((decision.maxWind - decision.minWind) / 35) * 100));
  const barCurrent = Math.min(100, (maxWind / 35) * 100);
  const suggestedKite = getSuggestedKite(maxWind, profile.weight);

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
          <div className={`text-5xl font-mono font-black ${cfg.color} leading-none`}>
            {cfg.icon}
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4">{decision.explanation}</p>

        <div className="space-y-1">
          <div className="relative h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-emerald-500/25 rounded-full"
              style={{ left: `${barMin}%`, width: `${barWidth}%` }}
            />
            <div
              className={`absolute top-0 w-1 h-full ${cfg.barColor} rounded-full transition-all duration-300`}
              style={{ left: `${barCurrent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 kn</span>
            <span className="text-emerald-400/80">Ideal: {decision.minWind}–{decision.maxWind} kn</span>
            <span>35 kn</span>
          </div>
        </div>
      </div>

      {/* ── Stats rápidos ───────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-card rounded-xl border border-border p-3 text-center">
          <div className="text-2xl font-bold text-primary">{maxWind}</div>
          <div className="text-xs text-muted-foreground">kn máx</div>
          <div className="text-xs text-muted-foreground/60 truncate">{bestStation.name.split(" ")[0]}</div>
        </div>
        <div className="bg-gradient-card rounded-xl border border-border p-3 text-center">
          <div className="text-2xl font-bold text-accent">{avgWind}</div>
          <div className="text-xs text-muted-foreground">kn prom</div>
          <div className="text-xs text-muted-foreground/60">{stations.length} spots</div>
        </div>
        <div className="bg-gradient-card rounded-xl border border-border p-3 text-center">
          <div className="text-2xl font-bold text-foreground">
            {stations.filter((s) => s.windSpeed >= decision.minWind).length}
          </div>
          <div className="text-xs text-muted-foreground">spots ok</div>
          <div className="text-xs text-muted-foreground/60">≥{decision.minWind} kn</div>
        </div>
      </div>

      {/* ── Gráfico horario de hoy ──────────────────────── */}
      {todayHours.length > 0 && (
        <div className="bg-gradient-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
            Pronóstico de hoy — hora a hora
          </p>
          <div className="flex items-end gap-1 h-16">
            {todayHours.map((h, i) => {
              const d      = evaluateConditions({ windSpeed: h.windSpeed, windDirection: h.windDirection, userProfile: profile });
              const barCfg = CONDITION_CONFIG[d.condition];
              const pct    = Math.max(8, (h.windSpeed / maxForecastWind) * 100);
              const now    = new Date();
              const isPast = h.time < now;
              return (
                <div key={i} className="flex-1">
                  <div
                    className={`w-full rounded-t ${barCfg.barColor} ${isPast ? "opacity-30" : "opacity-80"}`}
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

      {/* ── Sugerencia de kite ──────────────────────────── */}
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

      {/* ── Perfil del usuario ──────────────────────────── */}
      <div className="bg-gradient-card rounded-xl border border-border overflow-hidden">
        <button
          className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
          onClick={() => setShowProfile((v) => !v)}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <User className="w-4 h-4 text-primary" />
            Mi perfil de rider
            <span className="text-xs text-muted-foreground font-normal">
              · {profile.weight} kg · {profile.kiteSize}m²
            </span>
          </div>
          {showProfile
            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground" />
          }
        </button>

        {showProfile && (
          <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">
                Peso: {profile.weight} kg
              </label>
              <input
                type="range" min={50} max={120} step={5}
                value={profile.weight}
                onChange={(e) => onProfileChange({ ...profile, weight: Number(e.target.value) })}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>50 kg</span><span>120 kg</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Kite</label>
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

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Tabla</label>
              <div className="flex flex-wrap gap-2">
                {(["twintip", "directional", "foil"] as UserProfile["boardType"][]).map((type) => (
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
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
