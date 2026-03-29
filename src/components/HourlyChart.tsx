// Gráfico horario interactivo multi-día y multi-modelo.
// Permite navegar entre los 7 días del pronóstico.
// SVG puro + React pointer events (desktop y móvil).

import { useMemo, useState, useRef, useCallback } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ModelForecast } from "@/hooks/useForecast";
import { UserProfile, evaluateConditions, SailingCondition, getIdealRange } from "@/lib/windDecision";

interface HourlyChartProps {
  models:  ModelForecast[];
  profile: UserProfile;
}

const MODEL_STYLE: Record<string, { color: string; label: string; popular: string }> = {
  gfs:   { color: "#60a5fa", label: "GFS / NOAA", popular: "Windguru" },
  ecmwf: { color: "#34d399", label: "ECMWF IFS",  popular: "Windy"    },
  icon:  { color: "#fbbf24", label: "ICON",        popular: "DWD"      },
};
const AVG_COLOR = "#f1f5f9";

const COND_FILL: Record<SailingCondition, string> = {
  ideal:              "rgba(52,211,153,0.10)",
  condiciones_medias: "rgba(251,191,36,0.07)",
  no_navegable:       "transparent",
};
const STRIP_COLOR: Record<SailingCondition, string> = {
  ideal:              "#34d399",
  condiciones_medias: "#fbbf24",
  no_navegable:       "transparent",
};

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6..21

const W = 560, H = 148;
const ML = 32, MR = 8, MT = 18, MB = 20;
const PW = W - ML - MR;
const PH = H - MT - MB;
const STRIP_H = 7;

const xOf   = (h: number)              => ((h - HOURS[0]) / (HOURS[HOURS.length - 1] - HOURS[0])) * PW;
const yOf   = (kn: number, top: number) => PH - Math.min(kn / top, 1) * PH;
const topts = (rows: { x: number; y: number }[]) =>
  rows.map(r => `${r.x.toFixed(1)},${r.y.toFixed(1)}`).join(" ");

// ── Tipos ─────────────────────────────────────────────────
interface HourRow {
  hour:     number;
  avgSpeed: number | null;
  avgGust:  number | null;
  byModel:  Record<string, { speed: number; gust: number } | null>;
}
interface DayTab {
  index:    number;
  label:    string;        // "Hoy", "Mañana", "Lunes"...
  maxWind:  number | null; // pico del promedio ese día
  hasIdeal: boolean;       // tiene al menos 1 hora ideal
}

// ── Construcción de datos ─────────────────────────────────
function buildDayData(models: ModelForecast[], dayIndex: number, profile: UserProfile) {
  const live = models.filter(m => m.available && (m.forecast[dayIndex]?.hours?.length ?? 0) > 0);
  if (live.length === 0) return null;

  const [idealMin, idealMax] = getIdealRange(profile);

  const modelMaps = live.map(m => {
    const hm = new Map<number, { speed: number; gust: number }>();
    (m.forecast[dayIndex]?.hours ?? []).forEach(h =>
      hm.set(h.time.getHours(), { speed: h.windSpeed, gust: h.gustSpeed })
    );
    return { key: m.key, hm };
  });

  const rows: HourRow[] = HOURS.map(hour => {
    const vals  = modelMaps.map(m => m.hm.get(hour) ?? null);
    const avail = vals.filter((v): v is { speed: number; gust: number } => v !== null);
    const avgSpeed = avail.length ? Math.round(avail.reduce((s, v) => s + v.speed, 0) / avail.length) : null;
    const avgGust  = avail.length ? Math.round(avail.reduce((s, v) => s + v.gust,  0) / avail.length) : null;
    return { hour, avgSpeed, avgGust,
      byModel: Object.fromEntries(modelMaps.map((m, i) => [m.key, vals[i]])) };
  });

  const allSpeeds = rows.flatMap(r =>
    [r.avgSpeed, ...Object.values(r.byModel).map(v => v?.speed ?? null)]
  ).filter((v): v is number => v !== null);
  const topKn = Math.ceil(Math.max(40, ...allSpeeds) / 10) * 10;

  const hasIdeal = rows.some(r =>
    r.avgSpeed !== null && r.avgSpeed >= idealMin && r.avgSpeed <= idealMax
  );

  return { modelMaps, rows, topKn, live, hasIdeal };
}

// ── Tabs de días disponibles ──────────────────────────────
function buildDayTabs(models: ModelForecast[], profile: UserProfile): DayTab[] {
  const ref = models.find(m => m.available && m.forecast.length > 0);
  if (!ref) return [];
  const [idealMin, idealMax] = getIdealRange(profile);
  return ref.forecast.slice(0, 7).map((day, i) => {
    // Calcular pico promedio del día con todos los modelos disponibles
    const liveMaps = models
      .filter(m => m.available && (m.forecast[i]?.hours?.length ?? 0) > 0)
      .map(m => (m.forecast[i]?.hours ?? []).map(h => h.windSpeed));
    const hourAvgs = HOURS.map(hour => {
      const vals = liveMaps.map(hrs => hrs[hour - 6] ?? null).filter((v): v is number => v !== null);
      return vals.length ? vals.reduce((a, b) => a + b) / vals.length : null;
    }).filter((v): v is number => v !== null);
    const maxWind  = hourAvgs.length ? Math.round(Math.max(...hourAvgs)) : null;
    const hasIdeal = hourAvgs.some(v => v >= idealMin && v <= idealMax);
    return { index: i, label: day.dayLabel, maxWind, hasIdeal };
  });
}

// ── Componente ────────────────────────────────────────────
export default function HourlyChart({ models, profile }: HourlyChartProps) {
  const [dayIndex,   setDayIndex]   = useState(0);
  const [hoverHour,  setHoverHour]  = useState<number | null>(null);
  const containerRef                = useRef<HTMLDivElement>(null);

  const dayTabs = useMemo(() => buildDayTabs(models, profile), [models, profile]);
  const data    = useMemo(() => buildDayData(models, dayIndex, profile), [models, dayIndex, profile]);

  const maxDay  = dayTabs.length - 1;

  const handlePointerMove = useCallback((e: ReactPointerEvent) => {
    if (!containerRef.current) return;
    const rect  = containerRef.current.getBoundingClientRect();
    const svgX  = ((e.clientX - rect.left) / rect.width) * W;
    const plotX = Math.max(0, Math.min(PW, svgX - ML));
    const idx   = Math.round((plotX / PW) * (HOURS.length - 1));
    setHoverHour(HOURS[Math.max(0, Math.min(HOURS.length - 1, idx))]);
  }, []);

  const handlePointerLeave = useCallback(() => setHoverHour(null), []);

  const changeDay = (dir: -1 | 1) => {
    setHoverHour(null);
    setDayIndex(d => Math.max(0, Math.min(maxDay, d + dir)));
  };

  if (dayTabs.length === 0 || !data) return null;
  const { modelMaps, rows, topKn, live } = data;

  const yScale   = (kn: number) => yOf(kn, topKn);
  const nowHour  = new Date().getHours();
  const gridKn   = [10, 20, 30, topKn].filter((v, i, a) => a.indexOf(v) === i && v <= topKn);

  const [idealMin, idealMax] = getIdealRange(profile);
  const bandTop    = Math.max(0, yScale(idealMax));
  const bandBottom = Math.min(PH, yScale(idealMin));
  const bandH      = Math.max(0, bandBottom - bandTop);

  const hoverRow = hoverHour !== null ? (rows.find(r => r.hour === hoverHour) ?? null) : null;
  const tipPct   = hoverHour !== null ? (xOf(hoverHour) + ML) / W * 100 : 0;
  const tipFlip  = tipPct > 68;

  return (
    <div className="bg-gradient-card rounded-xl border border-border p-4">

      {/* ── Navegación de días ────────────────────────── */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => changeDay(-1)}
          disabled={dayIndex === 0}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Tabs de días */}
        <div className="flex-1 flex gap-1 overflow-x-auto scrollbar-none">
          {dayTabs.map(tab => (
            <button
              key={tab.index}
              onClick={() => { setDayIndex(tab.index); setHoverHour(null); }}
              className={`flex-shrink-0 flex flex-col items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tab.index === dayIndex
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              <span>{tab.label}</span>
              <div className="flex items-center gap-1 mt-0.5">
                {tab.maxWind !== null && (
                  <span className={`text-[10px] tabular-nums font-normal ${
                    tab.index === dayIndex ? "text-primary/70" : "text-muted-foreground/50"
                  }`}>
                    {tab.maxWind} kn
                  </span>
                )}
                {tab.hasIdeal && (
                  <span className="text-[10px] text-emerald-400" title="Tiene ventana óptima">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => changeDay(1)}
          disabled={dayIndex === maxDay}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Hint + rango óptimo ───────────────────────── */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-emerald-400/70">
          Ventana óptima: <span className="font-semibold text-emerald-400">{idealMin}–{idealMax} kn</span>
          <span className="text-muted-foreground/40"> · {profile.kiteSize}m² · {profile.weight} kg</span>
        </p>
        <p className="text-xs text-muted-foreground/45 hidden sm:flex items-center gap-1">
          <span>🖱</span> Deslizá el mouse
        </p>
        <p className="text-xs text-muted-foreground/45 flex sm:hidden items-center gap-1">
          <span>👆</span> Deslizá el dedo
        </p>
      </div>

      {/* ── Leyenda ───────────────────────────────────── */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
        {live.map(m => {
          const ms = MODEL_STYLE[m.key];
          return (
            <div key={m.key} className="flex items-center gap-1.5">
              <svg width="16" height="8">
                <line x1="0" y1="4" x2="16" y2="4"
                  stroke={ms?.color ?? "#888"} strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-xs text-muted-foreground">
                {ms?.label ?? m.label}
                {ms?.popular && (
                  <span className="text-muted-foreground/45"> ({ms.popular})</span>
                )}
              </span>
            </div>
          );
        })}
        {live.length > 1 && (
          <div className="flex items-center gap-1.5">
            <svg width="16" height="8">
              <line x1="0" y1="4" x2="16" y2="4"
                stroke={AVG_COLOR} strokeWidth="3" strokeLinecap="round" />
            </svg>
            <span className="text-xs text-muted-foreground font-semibold">Promedio</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="w-3 h-3 rounded-sm border border-emerald-400/50 bg-emerald-400/20" />
          <span className="text-xs text-muted-foreground/60">rango navegable</span>
        </div>
      </div>

      {/* ── Área interactiva ──────────────────────────── */}
      <div
        ref={containerRef}
        className="relative select-none"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{ touchAction: "none", cursor: "crosshair" }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}
          aria-label={`Pronóstico horario de viento — ${dayTabs[dayIndex]?.label}`}>
          <g transform={`translate(${ML},${MT})`}>

            {/* Grilla */}
            {gridKn.map(kn => (
              <g key={kn}>
                <line x1={0} y1={yScale(kn)} x2={PW} y2={yScale(kn)}
                  stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
                {Math.abs(kn - idealMin) > 3 && Math.abs(kn - idealMax) > 3 && (
                  <text x={-4} y={yScale(kn) + 3.5}
                    textAnchor="end" fontSize={8.5} fill="rgba(255,255,255,0.25)">{kn}</text>
                )}
              </g>
            ))}

            {/* Banda horizontal del rango ideal */}
            {bandH > 0 && (
              <>
                <rect x={0} y={bandTop} width={PW} height={bandH}
                  fill="rgba(52,211,153,0.10)" />
                <line x1={0} y1={bandTop} x2={PW} y2={bandTop}
                  stroke="rgba(52,211,153,0.40)" strokeWidth={1} strokeDasharray="4,3" />
                <line x1={0} y1={bandBottom} x2={PW} y2={bandBottom}
                  stroke="rgba(52,211,153,0.40)" strokeWidth={1} strokeDasharray="4,3" />
                <text x={-4} y={bandTop + 3.5}
                  textAnchor="end" fontSize={8.5} fontWeight="600" fill="rgba(52,211,153,0.75)">{idealMax}</text>
                <text x={-4} y={bandBottom + 3.5}
                  textAnchor="end" fontSize={8.5} fontWeight="600" fill="rgba(52,211,153,0.75)">{idealMin}</text>
              </>
            )}

            {/* Zonas de condición por hora */}
            {rows.map((row, i) => {
              if (row.avgSpeed === null) return null;
              const cond = evaluateConditions({ windSpeed: row.avgSpeed, windDirection: 180, userProfile: profile });
              const fill = COND_FILL[cond.condition];
              if (fill === "transparent") return null;
              const x0 = i === 0 ? 0 : (xOf(rows[i - 1].hour) + xOf(row.hour)) / 2;
              const x1 = i === rows.length - 1 ? PW : (xOf(row.hour) + xOf(rows[i + 1].hour)) / 2;
              return <rect key={row.hour} x={x0} y={0} width={Math.max(0, x1 - x0)} height={PH}
                fill={fill} />;
            })}

            {/* Strip superior: ventana óptima */}
            {rows.map((row, i) => {
              if (row.avgSpeed === null) return null;
              const cond  = evaluateConditions({ windSpeed: row.avgSpeed, windDirection: 180, userProfile: profile });
              const color = STRIP_COLOR[cond.condition];
              if (color === "transparent") return null;
              const x0   = i === 0 ? 0 : (xOf(rows[i - 1].hour) + xOf(row.hour)) / 2;
              const x1   = i === rows.length - 1 ? PW : (xOf(row.hour) + xOf(rows[i + 1].hour)) / 2;
              const opac = cond.condition === "ideal" ? 0.80 : 0.40;
              return <rect key={`s-${row.hour}`}
                x={x0} y={-(STRIP_H + 3)} width={Math.max(0, x1 - x0)} height={STRIP_H}
                fill={color} opacity={opac} rx={2} />;
            })}
            <text x={-4} y={-(STRIP_H + 3) + STRIP_H / 2 + 3}
              textAnchor="end" fontSize={7} fill="rgba(255,255,255,0.22)">ventana</text>

            {/* Línea "ahora" — solo el día actual */}
            {dayIndex === 0 && HOURS.includes(nowHour) && (
              <line x1={xOf(nowHour)} y1={-(STRIP_H + 3)} x2={xOf(nowHour)} y2={PH}
                stroke="rgba(255,255,255,0.28)" strokeWidth={1} strokeDasharray="4,3" />
            )}

            {/* Líneas de cada modelo */}
            {modelMaps.map(m => {
              const pts = rows
                .filter(r => r.byModel[m.key] !== null)
                .map(r => ({ x: xOf(r.hour), y: yScale(r.byModel[m.key]!.speed) }));
              if (pts.length < 2) return null;
              return <polyline key={m.key} points={topts(pts)}
                fill="none" stroke={MODEL_STYLE[m.key]?.color ?? "#888"}
                strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" opacity={0.88} />;
            })}

            {/* Línea promedio */}
            {live.length > 1 && (() => {
              const pts = rows.filter(r => r.avgSpeed !== null)
                .map(r => ({ x: xOf(r.hour), y: yScale(r.avgSpeed!) }));
              if (pts.length < 2) return null;
              return <polyline points={topts(pts)}
                fill="none" stroke={AVG_COLOR}
                strokeWidth={2.8} strokeLinejoin="round" strokeLinecap="round" opacity={0.95} />;
            })()}

            {/* Crosshair */}
            {hoverHour !== null && (
              <>
                <line x1={xOf(hoverHour)} y1={-(STRIP_H + 3)} x2={xOf(hoverHour)} y2={PH}
                  stroke="rgba(255,255,255,0.50)" strokeWidth={1} />
                {modelMaps.map(m => {
                  const val = hoverRow?.byModel[m.key];
                  if (!val) return null;
                  return <circle key={m.key}
                    cx={xOf(hoverHour)} cy={yScale(val.speed)} r={4}
                    fill={MODEL_STYLE[m.key]?.color ?? "#888"}
                    stroke="rgba(10,20,35,0.9)" strokeWidth={1.5} />;
                })}
                {live.length > 1 && hoverRow?.avgSpeed != null && (
                  <circle cx={xOf(hoverHour)} cy={yScale(hoverRow.avgSpeed)} r={5}
                    fill={AVG_COLOR} stroke="rgba(10,20,35,0.9)" strokeWidth={1.5} />
                )}
              </>
            )}

            {/* Eje X */}
            {HOURS.filter((_, i) => i % 2 === 0).map(hour => (
              <text key={hour} x={xOf(hour)} y={PH + 13}
                textAnchor="middle" fontSize={9}
                fill={dayIndex === 0 && hour === nowHour ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.28)"}
                fontWeight={dayIndex === 0 && hour === nowHour ? "600" : "normal"}>
                {hour}h
              </text>
            ))}

            <rect x={0} y={0} width={PW} height={PH}
              fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1} rx={2} />
          </g>
        </svg>

        {/* Tooltip */}
        {hoverHour !== null && hoverRow && (
          <div
            className="absolute bottom-7 z-20 pointer-events-none"
            style={{
              left:      `${tipPct}%`,
              transform: tipFlip ? "translateX(calc(-100% - 8px))" : "translateX(8px)",
            }}
          >
            <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-xl px-3 py-2.5 min-w-[200px]">
              {/* Hora + condición */}
              {(() => {
                const cond = hoverRow.avgSpeed !== null
                  ? evaluateConditions({ windSpeed: hoverRow.avgSpeed, windDirection: 180, userProfile: profile })
                  : null;
                const dot = cond?.condition === "ideal" ? "#34d399"
                  : cond?.condition === "condiciones_medias" ? "#fbbf24" : "#f87171";
                return (
                  <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-border">
                    <span className="text-xs font-bold text-foreground">
                      {dayTabs[dayIndex]?.label} · {hoverHour}:00 h
                    </span>
                    {cond && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dot }} />
                        <span className="text-xs text-muted-foreground">{cond.label}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="space-y-1.5">
                {modelMaps.map(m => {
                  const ms       = MODEL_STYLE[m.key];
                  const val      = hoverRow.byModel[m.key];
                  const inRange  = val ? val.speed >= idealMin && val.speed <= idealMax : false;
                  return (
                    <div key={m.key} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: ms?.color ?? "#888" }} />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-muted-foreground">{ms?.label ?? m.key}</span>
                        {ms?.popular && (
                          <span className="text-xs text-muted-foreground/45"> ({ms.popular})</span>
                        )}
                      </div>
                      {val ? (
                        <span className={`text-xs tabular-nums ml-auto text-right shrink-0 ${inRange ? "text-emerald-400" : ""}`}>
                          <span className="font-bold">{val.speed}</span>
                          <span className="opacity-70"> kn</span>
                          {val.gust > 0 && <span className="opacity-50"> ↑{val.gust}</span>}
                          {inRange && <span className="ml-1">✓</span>}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50 ml-auto">—</span>
                      )}
                    </div>
                  );
                })}

                {live.length > 1 && hoverRow.avgSpeed !== null && (
                  <div className="flex items-center gap-2 pt-1.5 mt-0.5 border-t border-border">
                    <div className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: AVG_COLOR }} />
                    <span className="text-xs font-semibold text-muted-foreground flex-1">Promedio</span>
                    <span className={`text-xs tabular-nums ml-auto text-right shrink-0 ${
                      hoverRow.avgSpeed >= idealMin && hoverRow.avgSpeed <= idealMax ? "text-emerald-400" : ""
                    }`}>
                      <span className="font-bold">{hoverRow.avgSpeed}</span>
                      <span className="opacity-70"> kn</span>
                      {hoverRow.avgGust !== null && hoverRow.avgGust > 0 && (
                        <span className="opacity-50"> ↑{hoverRow.avgGust}</span>
                      )}
                      {hoverRow.avgSpeed >= idealMin && hoverRow.avgSpeed <= idealMax && (
                        <span className="ml-1">✓</span>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
