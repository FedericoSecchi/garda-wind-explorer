import { useState, useMemo } from "react";
import { Calendar, Wind, Check, X, Minus, Clock } from "lucide-react";
import { ForecastDay } from "@/data/forecast";
import {
  UserProfile,
  evaluateConditions,
  SailingCondition,
  CONDITION_CONFIG,
} from "@/lib/windDecision";
import { useLanguage } from "@/hooks/useLanguage";

interface PlannerProps {
  profile:  UserProfile;
  forecast: ForecastDay[];
}

const CONDITION_ICONS: Record<SailingCondition, typeof Check> = {
  ideal: Check,
  condiciones_medias: Minus,
  no_navegable: X,
};

// Returns best contiguous sailing window for a day
function getBestWindow(day: ForecastDay, profile: UserProfile): { from: number; to: number; peakKn: number } | null {
  const ideal = day.hours.filter(h => {
    const d = evaluateConditions({ windSpeed: h.windSpeed, windDirection: h.windDirection, userProfile: profile });
    return d.condition === "ideal";
  });
  if (ideal.length === 0) return null;

  let best = [ideal[0]];
  let cur  = [ideal[0]];
  for (let i = 1; i < ideal.length; i++) {
    if (ideal[i].time.getHours() === ideal[i - 1].time.getHours() + 1) {
      cur.push(ideal[i]);
    } else {
      cur = [ideal[i]];
    }
    if (cur.length > best.length) best = [...cur];
  }
  const peakKn = Math.max(...best.map(h => h.windSpeed));
  return { from: best[0].time.getHours(), to: best[best.length - 1].time.getHours(), peakKn };
}

// Prominent answer card for a single day
function DayAnswer({ day, profile, label }: { day: ForecastDay; profile: UserProfile; label: string }) {
  const { t } = useLanguage();
  const bestWindow = getBestWindow(day, profile);
  const hasAny = day.hours.some(h => {
    const d = evaluateConditions({ windSpeed: h.windSpeed, windDirection: h.windDirection, userProfile: profile });
    return d.condition !== "no_navegable";
  });

  const canSail = !!bestWindow;
  const condKey: SailingCondition = canSail ? "ideal" : (hasAny ? "condiciones_medias" : "no_navegable");
  const cfg = CONDITION_CONFIG[condKey];

  return (
    <div className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`text-2xl font-bold ${cfg.color}`}>
            {canSail ? t("planner.yes") : (hasAny ? "~" : t("planner.no"))}
          </div>
          {canSail && (
            <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{bestWindow.from}:00 – {bestWindow.to}:00 h</span>
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          {(canSail || hasAny) ? (
            <>
              <div className={`text-2xl font-bold ${cfg.color}`}>{canSail ? bestWindow.peakKn : day.maxWind} kn</div>
              <div className="text-xs text-muted-foreground">{t("planner.peakAt")}</div>
            </>
          ) : (
            <X className="w-7 h-7 text-red-400" />
          )}
        </div>
      </div>
      {canSail && (
        <div className="mt-2 text-xs text-muted-foreground/70">
          {t("planner.bestWindow")}: {bestWindow.from}:00 – {bestWindow.to}:00 · pico {bestWindow.peakKn} kn
        </div>
      )}
    </div>
  );
}

export default function Planner({ profile, forecast }: PlannerProps) {
  const { t } = useLanguage();
  const [availableDays, setAvailableDays] = useState<Set<number>>(new Set());

  function toggleDay(idx: number) {
    setAvailableDays((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }

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
      const bestWindow = getBestWindow(day, profile);
      return { day, idx, decision, navigableHours, bestWindow };
    }),
    [profile, forecast]
  );

  const recommendedDays = planDays.filter(
    (d) => availableDays.has(d.idx) && d.decision.condition !== "no_navegable"
  );

  const today    = forecast[0] ?? null;
  const tomorrow = forecast[1] ?? null;

  return (
    <div className="space-y-4">

      {/* ── Answer cards ────────────────────────────────── */}
      {(today || tomorrow) && (
        <div className="grid sm:grid-cols-2 gap-3">
          {today    && <DayAnswer day={today}    profile={profile} label={t("planner.today")}    />}
          {tomorrow && <DayAnswer day={tomorrow} profile={profile} label={t("planner.tomorrow")} />}
        </div>
      )}

      {/* ── Weekly selector ─────────────────────────────── */}
      <div className="flex items-center gap-2 pt-1">
        <Calendar className="w-5 h-5 text-primary" />
        <div>
          <h3 className="font-semibold">{t("planner.title")}</h3>
          <p className="text-xs text-muted-foreground">{t("planner.subtitle")}</p>
        </div>
      </div>

      <div className="space-y-2">
        {planDays.map(({ day, idx, decision, navigableHours, bestWindow }) => {
          const isAvailable = availableDays.has(idx);
          const cfg = CONDITION_CONFIG[decision.condition];
          const Icon = CONDITION_ICONS[decision.condition];
          const maxBarWind = Math.max(...day.hours.map((h) => h.windSpeed), 1);

          const condLabel =
            decision.condition === "ideal"              ? t("cond.ideal")  :
            decision.condition === "condiciones_medias" ? t("cond.medium") : t("cond.no");

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
                  {/* Sparkline */}
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
                      <span className={`text-sm font-semibold ${cfg.color}`}>{condLabel}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <Wind className="w-3 h-3 inline mr-0.5" />
                      {day.maxWind} kn
                      {navigableHours > 0 && (
                        <span className="ml-1">· {navigableHours}h {t("planner.idealHours")}</span>
                      )}
                    </div>
                    {bestWindow && (
                      <div className="text-xs text-muted-foreground/60">
                        {bestWindow.from}:00–{bestWindow.to}:00
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Recommendation ──────────────────────────────── */}
      {availableDays.size > 0 && (
        <div className="bg-gradient-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
            {t("planner.reco")}
          </p>
          {recommendedDays.length > 0 ? (
            <div className="space-y-2">
              {recommendedDays.map(({ day, decision, navigableHours, bestWindow }) => (
                <div key={day.dayLabel} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <span className="font-semibold">{day.dayLabel}</span>
                    <span className="text-muted-foreground">
                      {" — "}
                      {decision.condition === "ideal"
                        ? `${t("planner.goSail")} ${day.maxWind} kn${bestWindow ? `, ${bestWindow.from}:00–${bestWindow.to}:00` : ""}${navigableHours > 0 ? ` · ${navigableHours}h ${t("planner.idealHours")}` : ""}`
                        : `${t("planner.mayWork")} ${day.maxWind} kn`}
                    </span>
                  </span>
                </div>
              ))}
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
