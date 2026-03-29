// ============================================================
// DATOS DE PRONÓSTICO
// ============================================================
// Fuente: Open-Meteo API (gratis, sin API key)
// GFS · ECMWF · ICON — 100% datos reales, sin fallback simulado
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

