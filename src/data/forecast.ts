// ============================================================
// DATOS DE PRONÓSTICO
// ============================================================
// Fuente real: Open-Meteo API (gratis, sin API key)
// Fallback: datos mock generados con patrones reales del Garda
// ============================================================

export interface ForecastHour {
  time: Date;
  windSpeed: number;    // nudos
  windDirection: number; // grados
  gustSpeed: number;    // nudos
}

export interface ForecastDay {
  date: Date;
  dayLabel: string;
  hours: ForecastHour[];
  maxWind: number;
  avgWind: number;
  peakHour: number;
}

// ─── Parser de respuesta Open-Meteo ───────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseOpenMeteoForecast(json: any): ForecastDay[] {
  const times: string[]   = json.hourly.time;
  const speeds: number[]  = json.hourly.windspeed_10m;
  const dirs: number[]    = json.hourly.winddirection_10m;
  const gusts: number[]   = json.hourly.windgusts_10m;

  const now = new Date();
  const todayKey     = now.toISOString().split("T")[0];
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowKey  = tomorrowDate.toISOString().split("T")[0];

  // Agrupar por día (solo horas diurnas 6-21)
  const dayMap = new Map<string, ForecastHour[]>();

  times.forEach((timeStr, i) => {
    const date = new Date(timeStr);
    const dayKey = timeStr.split("T")[0];
    const hour   = date.getHours();

    if (hour < 6 || hour > 21) return;

    if (!dayMap.has(dayKey)) dayMap.set(dayKey, []);
    dayMap.get(dayKey)!.push({
      time:         date,
      windSpeed:    Math.max(0, Math.round(speeds[i] ?? 0)),
      windDirection: Math.round(dirs[i]  ?? 0),
      gustSpeed:    Math.max(0, Math.round(gusts[i]  ?? 0)),
    });
  });

  return Array.from(dayMap.entries())
    .slice(0, 7)
    .map(([dayKey, hours]) => {
      const date   = new Date(dayKey + "T00:00:00");
      const winds  = hours.map((h) => h.windSpeed);
      const maxWind = Math.max(...winds, 0);
      const peakHour = hours.find((h) => h.windSpeed === maxWind)?.time.getHours() ?? 13;

      let dayLabel: string;
      if (dayKey === todayKey)     dayLabel = "Hoy";
      else if (dayKey === tomorrowKey) dayLabel = "Mañana";
      else {
        dayLabel = date.toLocaleDateString("es-AR", { weekday: "long" });
        dayLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
      }

      return {
        date,
        dayLabel,
        hours,
        maxWind,
        avgWind:  Math.round(winds.reduce((a, b) => a + b, 0) / Math.max(winds.length, 1)),
        peakHour,
      };
    });
}

// ─── Datos mock (fallback) ─────────────────────────────────
// Patrones de viento típicos del Garda (viento Ora: térmica de tarde)
const DAILY_PATTERNS = [
  { base: 8,  peak: 22, peakHour: 13 },
  { base: 5,  peak: 12, peakHour: 14 },
  { base: 10, peak: 28, peakHour: 12 },
  { base: 3,  peak: 7,  peakHour: 15 },
  { base: 7,  peak: 21, peakHour: 13 },
  { base: 12, peak: 25, peakHour: 11 },
  { base: 6,  peak: 15, peakHour: 14 },
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateDay(dayOffset: number, pattern: typeof DAILY_PATTERNS[0]): ForecastDay {
  const now  = new Date();
  const date = new Date(now);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(0, 0, 0, 0);

  const hours: ForecastHour[] = [];
  for (let h = 6; h <= 21; h++) {
    const time = new Date(date);
    time.setHours(h, 0, 0, 0);
    const dist      = Math.abs(h - pattern.peakHour);
    const windSpeed = Math.max(0,
      Math.round(pattern.base + (pattern.peak - pattern.base) * Math.exp(-0.12 * dist * dist))
      + Math.round((seededRandom(dayOffset * 100 + h) - 0.5) * 2)
    );
    hours.push({
      time,
      windSpeed,
      windDirection: 185 + Math.round((seededRandom(dayOffset * 200 + h) - 0.5) * 20),
      gustSpeed:     Math.round(windSpeed * (1.2 + seededRandom(dayOffset * 300 + h) * 0.15)),
    });
  }

  const winds = hours.map((h) => h.windSpeed);
  let dayLabel: string;
  if (dayOffset === 0)      dayLabel = "Hoy";
  else if (dayOffset === 1) dayLabel = "Mañana";
  else {
    dayLabel = date.toLocaleDateString("es-AR", { weekday: "long" });
    dayLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
  }

  return {
    date, dayLabel, hours,
    maxWind:  Math.max(...winds),
    avgWind:  Math.round(winds.reduce((a, b) => a + b, 0) / winds.length),
    peakHour: pattern.peakHour,
  };
}

export const mockForecast: ForecastDay[] = DAILY_PATTERNS.map((p, i) => generateDay(i, p));
