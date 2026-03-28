// Gráfico horario multi-modelo usando SVG puro (sin dependencias extra).
// Muestra una línea por modelo + línea de promedio.
// Fondo coloreado por condición (verde/amarillo/rojo) según perfil del usuario.
// Solo se renderiza si hay datos reales de la API.

import { useMemo } from "react";
import { ModelForecast } from "@/hooks/useForecast";
import { UserProfile, evaluateConditions, SailingCondition } from "@/lib/windDecision";

interface HourlyChartProps {
  models:  ModelForecast[];
  profile: UserProfile;
}

// Colores por modelo (deben contrastar bien sobre fondo oscuro)
const MODEL_STYLE: Record<string, { color: string; label: string }> = {
  gfs:   { color: "#60a5fa", label: "GFS / NOAA"  },
  ecmwf: { color: "#34d399", label: "ECMWF IFS"   },
  icon:  { color: "#fbbf24", label: "ICON (DWD)"  },
};
const AVG_COLOR    = "#f1f5f9";
const COND_FILL: Record<SailingCondition, string> = {
  ideal:              "rgba(52,211,153,0.13)",
  condiciones_medias: "rgba(251,191,36,0.11)",
  no_navegable:       "rgba(248,113,113,0.09)",
};

// Horas diurnas cubiertas por el pronóstico
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6..21

// Dimensiones SVG (viewBox, el CSS lo escala)
const W = 560, H = 140;
const ML = 28, MR = 6, MT = 6, MB = 20;
const PW = W - ML - MR;
const PH = H - MT - MB;

const xOf = (h: number)  => ((h - HOURS[0]) / (HOURS[HOURS.length - 1] - HOURS[0])) * PW;
const yOf = (kn: number, top: number) => PH - Math.min(kn / top, 1) * PH;
const pts  = (rows: { x: number; y: number }[]) =>
  rows.map(r => `${r.x.toFixed(1)},${r.y.toFixed(1)}`).join(" ");

export default function HourlyChart({ models, profile }: HourlyChartProps) {
  const data = useMemo(() => {
    const live = models.filter(m => m.available && (m.forecast[0]?.hours?.length ?? 0) > 0);
    if (live.length === 0) return null;

    // Construir mapa hora→velocidad por modelo
    const modelMaps = live.map(m => {
      const hm = new Map<number, number>();
      (m.forecast[0]?.hours ?? []).forEach(h => hm.set(h.time.getHours(), h.windSpeed));
      return { key: m.key, hm };
    });

    // Datos por hora: valor de cada modelo + promedio
    const rows = HOURS.map(hour => {
      const vals = modelMaps.map(m => m.hm.get(hour)).filter((v): v is number => v !== undefined);
      const avg  = vals.length ? Math.round(vals.reduce((a, b) => a + b) / vals.length) : null;
      return {
        hour,
        avg,
        byModel: Object.fromEntries(modelMaps.map(m => [m.key, m.hm.get(hour) ?? null])) as Record<string, number | null>,
      };
    });

    // Escala Y: mínimo 40 kn, redondeado arriba al siguiente múltiplo de 10
    const allVals = rows.flatMap(r => [r.avg, ...Object.values(r.byModel)]).filter((v): v is number => v !== null);
    const topKn   = Math.ceil(Math.max(40, ...allVals) / 10) * 10;

    return { modelMaps, rows, topKn, live };
  }, [models]);

  if (!data) return null;
  const { modelMaps, rows, topKn, live } = data;

  const yScale  = (kn: number) => yOf(kn, topKn);
  const nowHour = new Date().getHours();
  const gridKn  = Array.from(new Set([10, 20, 30, topKn])).filter(v => v <= topKn);

  return (
    <div className="bg-gradient-card rounded-xl border border-border p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
        Pronóstico de hoy — hora a hora
      </p>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
        {live.map(m => (
          <div key={m.key} className="flex items-center gap-1.5">
            <svg width="16" height="8">
              <line x1="0" y1="4" x2="16" y2="4"
                stroke={MODEL_STYLE[m.key]?.color ?? "#888"}
                strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="text-xs text-muted-foreground">{MODEL_STYLE[m.key]?.label ?? m.label}</span>
          </div>
        ))}
        {live.length > 1 && (
          <div className="flex items-center gap-1.5">
            <svg width="16" height="8">
              <line x1="0" y1="4" x2="16" y2="4"
                stroke={AVG_COLOR} strokeWidth="3" strokeLinecap="round" />
            </svg>
            <span className="text-xs text-muted-foreground font-semibold">Promedio</span>
          </div>
        )}
      </div>

      {/* SVG principal */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: "100%", display: "block" }}
        role="img"
        aria-label="Gráfico de pronóstico de viento hora a hora"
      >
        <g transform={`translate(${ML},${MT})`}>

          {/* ── Líneas de grilla ─────────────────────────── */}
          {gridKn.map(kn => (
            <g key={kn}>
              <line x1={0} y1={yScale(kn)} x2={PW} y2={yScale(kn)}
                stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
              <text x={-4} y={yScale(kn) + 3.5}
                textAnchor="end" fontSize={8.5} fill="rgba(255,255,255,0.3)">
                {kn}
              </text>
            </g>
          ))}

          {/* ── Zonas de condición (fondo coloreado) ─────── */}
          {rows.map((row, i) => {
            if (row.avg === null) return null;
            const cond = evaluateConditions({ windSpeed: row.avg, windDirection: 180, userProfile: profile });
            const x0 = i === 0 ? 0 : (xOf(rows[i - 1].hour) + xOf(row.hour)) / 2;
            const x1 = i === rows.length - 1 ? PW : (xOf(row.hour) + xOf(rows[i + 1].hour)) / 2;
            return (
              <rect key={row.hour} x={x0} y={0} width={Math.max(0, x1 - x0)} height={PH}
                fill={COND_FILL[cond.condition]} />
            );
          })}

          {/* ── Línea vertical "ahora" ────────────────────── */}
          {HOURS.includes(nowHour) && (
            <line x1={xOf(nowHour)} y1={0} x2={xOf(nowHour)} y2={PH}
              stroke="rgba(255,255,255,0.35)" strokeWidth={1} strokeDasharray="4,3" />
          )}

          {/* ── Líneas de cada modelo ─────────────────────── */}
          {modelMaps.map(m => {
            const linePts = rows
              .filter(r => r.byModel[m.key] !== null)
              .map(r => ({ x: xOf(r.hour), y: yScale(r.byModel[m.key]!) }));
            if (linePts.length < 2) return null;
            return (
              <polyline key={m.key}
                points={pts(linePts)}
                fill="none"
                stroke={MODEL_STYLE[m.key]?.color ?? "#888"}
                strokeWidth={1.8}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={0.88}
              />
            );
          })}

          {/* ── Línea promedio (solo si hay ≥ 2 modelos) ─── */}
          {live.length > 1 && (() => {
            const avgPts = rows
              .filter(r => r.avg !== null)
              .map(r => ({ x: xOf(r.hour), y: yScale(r.avg!) }));
            if (avgPts.length < 2) return null;
            return (
              <polyline
                points={pts(avgPts)}
                fill="none"
                stroke={AVG_COLOR}
                strokeWidth={2.8}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={0.95}
              />
            );
          })()}

          {/* ── Etiquetas eje X ───────────────────────────── */}
          {HOURS.filter((_, i) => i % 2 === 0).map(hour => (
            <text key={hour}
              x={xOf(hour)} y={PH + 13}
              textAnchor="middle" fontSize={9}
              fill={hour === nowHour ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.32)"}
              fontWeight={hour === nowHour ? "600" : "normal"}
            >
              {hour}h
            </text>
          ))}

          {/* Marco */}
          <rect x={0} y={0} width={PW} height={PH}
            fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1} rx={2} />
        </g>
      </svg>
    </div>
  );
}
