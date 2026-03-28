// Gráfico horario interactivo — hover/touch muestra nudos + ráfagas por fuente.
// Muestra la banda horizontal del rango de viento óptimo para el perfil del rider.
// SVG puro + React pointer events (desktop y móvil).

import { useMemo, useState, useRef, useCallback } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
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
// Strip de ventana óptima (encima del área)
const STRIP_COLOR: Record<SailingCondition, string> = {
  ideal:              "#34d399",
  condiciones_medias: "#fbbf24",
  no_navegable:       "transparent",
};

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6..21

// Dimensiones SVG
const W = 560, H = 148;
const ML = 32, MR = 8, MT = 18, MB = 20;
const PW = W - ML - MR;
const PH = H - MT - MB;
const STRIP_H = 7;

const xOf   = (h: number)              => ((h - HOURS[0]) / (HOURS[HOURS.length - 1] - HOURS[0])) * PW;
const yOf   = (kn: number, top: number) => PH - Math.min(kn / top, 1) * PH;
const topts = (rows: { x: number; y: number }[]) =>
  rows.map(r => `${r.x.toFixed(1)},${r.y.toFixed(1)}`).join(" ");

// ── Datos procesados ──────────────────────────────────────
interface HourRow {
  hour:     number;
  avgSpeed: number | null;
  avgGust:  number | null;
  byModel:  Record<string, { speed: number; gust: number } | null>;
}

function buildData(models: ModelForecast[]) {
  const live = models.filter(m => m.available && (m.forecast[0]?.hours?.length ?? 0) > 0);
  if (live.length === 0) return null;

  const modelMaps = live.map(m => {
    const hm = new Map<number, { speed: number; gust: number }>();
    (m.forecast[0]?.hours ?? []).forEach(h =>
      hm.set(h.time.getHours(), { speed: h.windSpeed, gust: h.gustSpeed })
    );
    return { key: m.key, hm };
  });

  const rows: HourRow[] = HOURS.map(hour => {
    const vals  = modelMaps.map(m => m.hm.get(hour) ?? null);
    const avail = vals.filter((v): v is { speed: number; gust: number } => v !== null);
    const avgSpeed = avail.length ? Math.round(avail.reduce((s, v) => s + v.speed, 0) / avail.length) : null;
    const avgGust  = avail.length ? Math.round(avail.reduce((s, v) => s + v.gust,  0) / avail.length) : null;
    return {
      hour, avgSpeed, avgGust,
      byModel: Object.fromEntries(modelMaps.map((m, i) => [m.key, vals[i]])),
    };
  });

  const allSpeeds = rows.flatMap(r =>
    [r.avgSpeed, ...Object.values(r.byModel).map(v => v?.speed ?? null)]
  ).filter((v): v is number => v !== null);
  const topKn = Math.ceil(Math.max(40, ...allSpeeds) / 10) * 10;

  return { modelMaps, rows, topKn, live };
}

// ── Componente ────────────────────────────────────────────
export default function HourlyChart({ models, profile }: HourlyChartProps) {
  const [hoverHour, setHoverHour] = useState<number | null>(null);
  const containerRef              = useRef<HTMLDivElement>(null);

  const data = useMemo(() => buildData(models), [models]);

  const handlePointerMove = useCallback((e: ReactPointerEvent) => {
    if (!containerRef.current) return;
    const rect  = containerRef.current.getBoundingClientRect();
    const svgX  = ((e.clientX - rect.left) / rect.width) * W;
    const plotX = Math.max(0, Math.min(PW, svgX - ML));
    const idx   = Math.round((plotX / PW) * (HOURS.length - 1));
    setHoverHour(HOURS[Math.max(0, Math.min(HOURS.length - 1, idx))]);
  }, []);

  const handlePointerLeave = useCallback(() => setHoverHour(null), []);

  if (!data) return null;
  const { modelMaps, rows, topKn, live } = data;

  const yScale    = (kn: number) => yOf(kn, topKn);
  const nowHour   = new Date().getHours();
  const gridKn    = [10, 20, 30, topKn].filter((v, i, a) => a.indexOf(v) === i && v <= topKn);

  // Rango ideal del perfil del rider
  const [idealMin, idealMax] = getIdealRange(profile);
  // Posición Y de la banda ideal (asegurarse que no salga del área)
  const bandTop    = Math.max(0, yScale(idealMax));
  const bandBottom = Math.min(PH, yScale(idealMin));
  const bandH      = Math.max(0, bandBottom - bandTop);

  const hoverRow = hoverHour !== null ? (rows.find(r => r.hour === hoverHour) ?? null) : null;
  const tipPct   = hoverHour !== null ? (xOf(hoverHour) + ML) / W * 100 : 0;
  const tipFlip  = tipPct > 68;

  return (
    <div className="bg-gradient-card rounded-xl border border-border p-4">

      {/* ── Título + hint ─────────────────────────────── */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          Pronóstico de hoy — hora a hora
        </p>
        <p className="text-xs text-muted-foreground/50 hidden sm:flex items-center gap-1">
          <span>🖱</span> Deslizá el mouse
        </p>
        <p className="text-xs text-muted-foreground/50 flex sm:hidden items-center gap-1">
          <span>👆</span> Deslizá el dedo
        </p>
      </div>

      {/* Descripción de la ventana óptima */}
      <p className="text-xs text-emerald-400/70 mb-3">
        Tu ventana óptima: <span className="font-semibold text-emerald-400">{idealMin}–{idealMax} kn</span>
        <span className="text-muted-foreground/50"> · kite {profile.kiteSize}m² · {profile.weight} kg</span>
      </p>

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
        {/* Referencia banda óptima */}
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
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", display: "block" }}
          aria-label="Gráfico interactivo de viento por hora"
        >
          <g transform={`translate(${ML},${MT})`}>

            {/* ── Líneas de grilla ─────────────────────── */}
            {gridKn.map(kn => (
              <g key={kn}>
                <line x1={0} y1={yScale(kn)} x2={PW} y2={yScale(kn)}
                  stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
                {/* No mostrar la etiqueta si coincide con idealMin o idealMax (para no superponer) */}
                {Math.abs(kn - idealMin) > 3 && Math.abs(kn - idealMax) > 3 && (
                  <text x={-4} y={yScale(kn) + 3.5}
                    textAnchor="end" fontSize={8.5} fill="rgba(255,255,255,0.25)">{kn}</text>
                )}
              </g>
            ))}

            {/* ── Banda horizontal del rango ideal ─────── */}
            {bandH > 0 && (
              <>
                {/* Relleno de la banda */}
                <rect x={0} y={bandTop} width={PW} height={bandH}
                  fill="rgba(52,211,153,0.10)" />
                {/* Borde superior de la banda (maxWind) */}
                <line x1={0} y1={bandTop} x2={PW} y2={bandTop}
                  stroke="rgba(52,211,153,0.45)" strokeWidth={1} strokeDasharray="4,3" />
                {/* Borde inferior de la banda (minWind) */}
                <line x1={0} y1={bandBottom} x2={PW} y2={bandBottom}
                  stroke="rgba(52,211,153,0.45)" strokeWidth={1} strokeDasharray="4,3" />
                {/* Etiquetas Y del rango ideal */}
                <text x={-4} y={bandTop + 3.5}
                  textAnchor="end" fontSize={8.5} fontWeight="600" fill="rgba(52,211,153,0.75)">
                  {idealMax}
                </text>
                <text x={-4} y={bandBottom + 3.5}
                  textAnchor="end" fontSize={8.5} fontWeight="600" fill="rgba(52,211,153,0.75)">
                  {idealMin}
                </text>
              </>
            )}

            {/* ── Zonas de condición por hora (fondo) ──── */}
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

            {/* ── Strip superior: ventana óptima ────────── */}
            {rows.map((row, i) => {
              if (row.avgSpeed === null) return null;
              const cond  = evaluateConditions({ windSpeed: row.avgSpeed, windDirection: 180, userProfile: profile });
              const color = STRIP_COLOR[cond.condition];
              if (color === "transparent") return null;
              const x0  = i === 0 ? 0 : (xOf(rows[i - 1].hour) + xOf(row.hour)) / 2;
              const x1  = i === rows.length - 1 ? PW : (xOf(row.hour) + xOf(rows[i + 1].hour)) / 2;
              const opac = cond.condition === "ideal" ? 0.80 : 0.40;
              return (
                <rect key={`s-${row.hour}`}
                  x={x0} y={-(STRIP_H + 3)}
                  width={Math.max(0, x1 - x0)} height={STRIP_H}
                  fill={color} opacity={opac} rx={2} />
              );
            })}
            <text x={-4} y={-(STRIP_H + 3) + STRIP_H / 2 + 3}
              textAnchor="end" fontSize={7} fill="rgba(255,255,255,0.22)">ventana</text>

            {/* ── Línea "ahora" ─────────────────────────── */}
            {HOURS.includes(nowHour) && (
              <line x1={xOf(nowHour)} y1={-(STRIP_H + 3)} x2={xOf(nowHour)} y2={PH}
                stroke="rgba(255,255,255,0.28)" strokeWidth={1} strokeDasharray="4,3" />
            )}

            {/* ── Líneas de cada modelo ─────────────────── */}
            {modelMaps.map(m => {
              const linePts = rows
                .filter(r => r.byModel[m.key] !== null)
                .map(r => ({ x: xOf(r.hour), y: yScale(r.byModel[m.key]!.speed) }));
              if (linePts.length < 2) return null;
              return (
                <polyline key={m.key} points={topts(linePts)}
                  fill="none" stroke={MODEL_STYLE[m.key]?.color ?? "#888"}
                  strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" opacity={0.88} />
              );
            })}

            {/* ── Línea promedio ────────────────────────── */}
            {live.length > 1 && (() => {
              const avgPts = rows
                .filter(r => r.avgSpeed !== null)
                .map(r => ({ x: xOf(r.hour), y: yScale(r.avgSpeed!) }));
              if (avgPts.length < 2) return null;
              return <polyline points={topts(avgPts)}
                fill="none" stroke={AVG_COLOR}
                strokeWidth={2.8} strokeLinejoin="round" strokeLinecap="round" opacity={0.95} />;
            })()}

            {/* ── Crosshair ─────────────────────────────── */}
            {hoverHour !== null && (
              <>
                <line x1={xOf(hoverHour)} y1={-(STRIP_H + 3)} x2={xOf(hoverHour)} y2={PH}
                  stroke="rgba(255,255,255,0.5)" strokeWidth={1} />
                {modelMaps.map(m => {
                  const val = hoverRow?.byModel[m.key];
                  if (!val) return null;
                  return (
                    <circle key={m.key}
                      cx={xOf(hoverHour)} cy={yScale(val.speed)} r={4}
                      fill={MODEL_STYLE[m.key]?.color ?? "#888"}
                      stroke="rgba(10,20,35,0.9)" strokeWidth={1.5} />
                  );
                })}
                {live.length > 1 && hoverRow?.avgSpeed != null && (
                  <circle cx={xOf(hoverHour)} cy={yScale(hoverRow.avgSpeed)} r={5}
                    fill={AVG_COLOR} stroke="rgba(10,20,35,0.9)" strokeWidth={1.5} />
                )}
              </>
            )}

            {/* ── Etiquetas eje X ───────────────────────── */}
            {HOURS.filter((_, i) => i % 2 === 0).map(hour => (
              <text key={hour} x={xOf(hour)} y={PH + 13}
                textAnchor="middle" fontSize={9}
                fill={hour === nowHour ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.28)"}
                fontWeight={hour === nowHour ? "600" : "normal"}>
                {hour}h
              </text>
            ))}

            {/* Marco */}
            <rect x={0} y={0} width={PW} height={PH}
              fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1} rx={2} />
          </g>
        </svg>

        {/* ── Tooltip ───────────────────────────────────── */}
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
                    <span className="text-xs font-bold text-foreground">{hoverHour}:00 h</span>
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
                  const ms  = MODEL_STYLE[m.key];
                  const val = hoverRow.byModel[m.key];
                  const inRange = val ? val.speed >= idealMin && val.speed <= idealMax : false;
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
                          {val.gust > 0 && (
                            <span className="opacity-50"> ↑{val.gust}</span>
                          )}
                          {inRange && <span className="ml-1">✓</span>}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50 ml-auto">—</span>
                      )}
                    </div>
                  );
                })}

                {/* Promedio */}
                {live.length > 1 && hoverRow.avgSpeed !== null && (
                  <div className="flex items-center gap-2 pt-1.5 mt-0.5 border-t border-border">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: AVG_COLOR }} />
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
