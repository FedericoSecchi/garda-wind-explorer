// Gráfico horario interactivo — hover/touch muestra nudos + ráfagas por fuente.
// SVG puro + React pointer events (funciona en desktop y móvil).
// Solo se renderiza con datos reales de la API.

import { useMemo, useState, useRef, useCallback } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { ModelForecast } from "@/hooks/useForecast";
import { UserProfile, evaluateConditions, SailingCondition } from "@/lib/windDecision";

interface HourlyChartProps {
  models:  ModelForecast[];
  profile: UserProfile;
}

const MODEL_STYLE: Record<string, { color: string; label: string }> = {
  gfs:   { color: "#60a5fa", label: "GFS / NOAA"  },
  ecmwf: { color: "#34d399", label: "ECMWF IFS"   },
  icon:  { color: "#fbbf24", label: "ICON (DWD)"  },
};
const AVG_COLOR = "#f1f5f9";

const COND_FILL: Record<SailingCondition, string> = {
  ideal:              "rgba(52,211,153,0.13)",
  condiciones_medias: "rgba(251,191,36,0.11)",
  no_navegable:       "rgba(248,113,113,0.09)",
};

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6..21

// SVG viewBox dimensions
const W = 560, H = 130;
const ML = 28, MR = 8, MT = 6, MB = 20;
const PW = W - ML - MR;
const PH = H - MT - MB;

const xOf   = (h: number)             => ((h - HOURS[0]) / (HOURS[HOURS.length - 1] - HOURS[0])) * PW;
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
    const vals = modelMaps.map(m => m.hm.get(hour) ?? null);
    const avail = vals.filter((v): v is { speed: number; gust: number } => v !== null);
    const avgSpeed = avail.length ? Math.round(avail.reduce((s, v) => s + v.speed, 0) / avail.length) : null;
    const avgGust  = avail.length ? Math.round(avail.reduce((s, v) => s + v.gust,  0) / avail.length) : null;
    return {
      hour,
      avgSpeed,
      avgGust,
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

  const yScale   = (kn: number) => yOf(kn, topKn);
  const nowHour  = new Date().getHours();
  const gridKn   = [10, 20, 30, topKn].filter((v, i, a) => a.indexOf(v) === i && v <= topKn);

  const hoverRow = hoverHour !== null ? rows.find(r => r.hour === hoverHour) ?? null : null;

  // Posición del tooltip (en % del contenedor)
  const tipPct = hoverHour !== null ? (xOf(hoverHour) + ML) / W * 100 : 0;
  const tipFlip = tipPct > 68; // voltear a la izquierda si está cerca del borde

  return (
    <div className="bg-gradient-card rounded-xl border border-border p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
        Pronóstico de hoy — hora a hora
      </p>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
        {live.map(m => (
          <div key={m.key} className="flex items-center gap-1.5">
            <svg width="16" height="8"><line x1="0" y1="4" x2="16" y2="4"
              stroke={MODEL_STYLE[m.key]?.color ?? "#888"} strokeWidth="2" strokeLinecap="round" /></svg>
            <span className="text-xs text-muted-foreground">{MODEL_STYLE[m.key]?.label ?? m.label}</span>
          </div>
        ))}
        {live.length > 1 && (
          <div className="flex items-center gap-1.5">
            <svg width="16" height="8"><line x1="0" y1="4" x2="16" y2="4"
              stroke={AVG_COLOR} strokeWidth="3" strokeLinecap="round" /></svg>
            <span className="text-xs text-muted-foreground font-semibold">Promedio</span>
          </div>
        )}
      </div>

      {/* Área interactiva */}
      <div
        ref={containerRef}
        className="relative select-none"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{ touchAction: "none", cursor: "crosshair" }}
      >
        {/* SVG del gráfico */}
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", display: "block" }}
          aria-label="Gráfico interactivo de viento por hora"
        >
          <g transform={`translate(${ML},${MT})`}>

            {/* Líneas de grilla */}
            {gridKn.map(kn => (
              <g key={kn}>
                <line x1={0} y1={yScale(kn)} x2={PW} y2={yScale(kn)}
                  stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                <text x={-4} y={yScale(kn) + 3.5}
                  textAnchor="end" fontSize={8.5} fill="rgba(255,255,255,0.3)">{kn}</text>
              </g>
            ))}

            {/* Zonas de condición por hora */}
            {rows.map((row, i) => {
              if (row.avgSpeed === null) return null;
              const cond = evaluateConditions({ windSpeed: row.avgSpeed, windDirection: 180, userProfile: profile });
              const x0   = i === 0 ? 0 : (xOf(rows[i - 1].hour) + xOf(row.hour)) / 2;
              const x1   = i === rows.length - 1 ? PW : (xOf(row.hour) + xOf(rows[i + 1].hour)) / 2;
              return <rect key={row.hour} x={x0} y={0} width={Math.max(0, x1 - x0)} height={PH}
                fill={COND_FILL[cond.condition]} />;
            })}

            {/* Línea "ahora" */}
            {HOURS.includes(nowHour) && (
              <line x1={xOf(nowHour)} y1={0} x2={xOf(nowHour)} y2={PH}
                stroke="rgba(255,255,255,0.3)" strokeWidth={1} strokeDasharray="4,3" />
            )}

            {/* Líneas de cada modelo */}
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

            {/* Línea promedio */}
            {live.length > 1 && (() => {
              const avgPts = rows
                .filter(r => r.avgSpeed !== null)
                .map(r => ({ x: xOf(r.hour), y: yScale(r.avgSpeed!) }));
              if (avgPts.length < 2) return null;
              return <polyline points={topts(avgPts)}
                fill="none" stroke={AVG_COLOR}
                strokeWidth={2.8} strokeLinejoin="round" strokeLinecap="round" opacity={0.95} />;
            })()}

            {/* ── Crosshair interactivo ───────────────────── */}
            {hoverHour !== null && (
              <>
                {/* Línea vertical */}
                <line x1={xOf(hoverHour)} y1={0} x2={xOf(hoverHour)} y2={PH}
                  stroke="rgba(255,255,255,0.55)" strokeWidth={1} />

                {/* Puntos en cada línea de modelo */}
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

                {/* Punto promedio */}
                {live.length > 1 && hoverRow?.avgSpeed !== null && hoverRow?.avgSpeed !== undefined && (
                  <circle cx={xOf(hoverHour)} cy={yScale(hoverRow.avgSpeed)} r={5}
                    fill={AVG_COLOR} stroke="rgba(10,20,35,0.9)" strokeWidth={1.5} />
                )}
              </>
            )}

            {/* Etiquetas eje X */}
            {HOURS.filter((_, i) => i % 2 === 0).map(hour => (
              <text key={hour} x={xOf(hour)} y={PH + 13}
                textAnchor="middle" fontSize={9}
                fill={hour === nowHour ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)"}
                fontWeight={hour === nowHour ? "600" : "normal"}>
                {hour}h
              </text>
            ))}

            {/* Marco */}
            <rect x={0} y={0} width={PW} height={PH}
              fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1} rx={2} />
          </g>
        </svg>

        {/* ── Tooltip ─────────────────────────────────── */}
        {hoverHour !== null && hoverRow && (
          <div
            className="absolute bottom-7 z-20 pointer-events-none"
            style={{
              left:      `${tipPct}%`,
              transform: tipFlip ? "translateX(calc(-100% - 8px))" : "translateX(8px)",
            }}
          >
            <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-xl px-3 py-2.5 min-w-[180px]">
              {/* Hora */}
              <div className="text-xs font-bold text-foreground mb-2 pb-1.5 border-b border-border">
                {hoverHour}:00 h
              </div>

              {/* Fila por modelo */}
              <div className="space-y-1.5">
                {modelMaps.map(m => {
                  const val = hoverRow.byModel[m.key];
                  return (
                    <div key={m.key} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: MODEL_STYLE[m.key]?.color ?? "#888" }} />
                      <span className="text-xs text-muted-foreground w-20 shrink-0">
                        {MODEL_STYLE[m.key]?.label ?? m.key}
                      </span>
                      {val ? (
                        <span className="text-xs tabular-nums ml-auto text-right">
                          <span className="font-bold text-foreground">{val.speed}</span>
                          <span className="text-muted-foreground"> kn</span>
                          {val.gust > 0 && (
                            <span className="text-muted-foreground/70"> · ↑{val.gust}</span>
                          )}
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
                    <span className="text-xs font-semibold text-muted-foreground w-20 shrink-0">Promedio</span>
                    <span className="text-xs tabular-nums ml-auto text-right">
                      <span className="font-bold text-foreground">{hoverRow.avgSpeed}</span>
                      <span className="text-muted-foreground"> kn</span>
                      {hoverRow.avgGust !== null && hoverRow.avgGust > 0 && (
                        <span className="text-muted-foreground/70"> · ↑{hoverRow.avgGust}</span>
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
