// ============================================================
// DATOS DE PRONÓSTICO (MOCK)
// ============================================================
// Simula un pronóstico horario de 7 días para Lago di Garda.
// En producción: reemplazar con Open-Meteo API (gratis, sin key).
// Endpoint real: https://api.open-meteo.com/v1/forecast?
//   latitude=45.68&longitude=10.73&hourly=windspeed_10m,winddirection_10m
// ============================================================

export interface ForecastHour {
  time: Date;
  windSpeed: number;    // nudos
  windDirection: number; // grados
  gustSpeed: number;    // nudos
}

export interface ForecastDay {
  date: Date;
  dayLabel: string;       // "Lunes", "Hoy", "Mañana"
  hours: ForecastHour[];
  maxWind: number;
  avgWind: number;
  peakHour: number;       // hora del pico de viento (0-23)
}

// Patrones de viento típicos del Garda (viento Ora: térmica de tarde)
const DAILY_PATTERNS = [
  { base: 8,  peak: 22, peakHour: 13 },  // Hoy
  { base: 5,  peak: 12, peakHour: 14 },  // Mañana - suave
  { base: 10, peak: 28, peakHour: 12 },  // Fuerte
  { base: 3,  peak: 7,  peakHour: 15 },  // Tranquilo
  { base: 7,  peak: 21, peakHour: 13 },  // Buena tarde
  { base: 12, peak: 25, peakHour: 11 },  // Mañana activa
  { base: 6,  peak: 15, peakHour: 14 },  // Moderado
];

function seededRandom(seed: number): number {
  // Pseudo-random determinista (sin variaciones en cada render)
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateDay(dayOffset: number, pattern: typeof DAILY_PATTERNS[0]): ForecastDay {
  const now = new Date();
  const date = new Date(now);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(0, 0, 0, 0);

  const hours: ForecastHour[] = [];

  for (let h = 6; h <= 21; h++) {
    const time = new Date(date);
    time.setHours(h, 0, 0, 0);

    // Curva gaussiana centrada en peakHour
    const dist = Math.abs(h - pattern.peakHour);
    const windSpeed = Math.round(
      pattern.base + (pattern.peak - pattern.base) * Math.exp(-0.12 * dist * dist)
    );

    // Variación leve determinista para que se vea real
    const noise = Math.round((seededRandom(dayOffset * 100 + h) - 0.5) * 2);

    hours.push({
      time,
      windSpeed: Math.max(0, windSpeed + noise),
      windDirection: 185 + Math.round((seededRandom(dayOffset * 200 + h) - 0.5) * 20),
      gustSpeed: Math.round(windSpeed * (1.2 + seededRandom(dayOffset * 300 + h) * 0.15)),
    });
  }

  const winds = hours.map((h) => h.windSpeed);

  let dayLabel: string;
  if (dayOffset === 0) dayLabel = "Hoy";
  else if (dayOffset === 1) dayLabel = "Mañana";
  else {
    dayLabel = date.toLocaleDateString("es-AR", { weekday: "long" });
    dayLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
  }

  return {
    date,
    dayLabel,
    hours,
    maxWind: Math.max(...winds),
    avgWind: Math.round(winds.reduce((a, b) => a + b, 0) / winds.length),
    peakHour: pattern.peakHour,
  };
}

export const mockForecast: ForecastDay[] = DAILY_PATTERNS.map((pattern, i) =>
  generateDay(i, pattern)
);

// ─── Parser para respuesta real de Open-Meteo ─────────────
// Convierte la respuesta JSON de la API al formato ForecastDay[].
// Usado por useForecast.ts para los 3 modelos simultáneos.
export function parseOpenMeteoForecast(json: {
  hourly: {
    time: string[];
    windspeed_10m: number[];
    winddirection_10m: number[];
    windgusts_10m: number[];
  };
}): ForecastDay[] {
  const { time, windspeed_10m, winddirection_10m, windgusts_10m } = json.hourly;

  // Agrupar horas por día
  const dayMap = new Map<string, ForecastHour[]>();
  for (let i = 0; i < time.length; i++) {
    const t = new Date(time[i]);
    const dayKey = t.toISOString().slice(0, 10);
    if (!dayMap.has(dayKey)) dayMap.set(dayKey, []);
    dayMap.get(dayKey)!.push({
      time: t,
      windSpeed:     Math.round(windspeed_10m[i] ?? 0),
      windDirection: Math.round(winddirection_10m[i] ?? 0),
      gustSpeed:     Math.round(windgusts_10m[i] ?? 0),
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from(dayMap.entries()).map(([dateStr, hours]) => {
    const date = new Date(dateStr + "T00:00:00");
    const winds = hours.map((h) => h.windSpeed);
    const diffDays = Math.round((date.getTime() - today.getTime()) / 86_400_000);

    let dayLabel: string;
    if (diffDays === 0)      dayLabel = "Hoy";
    else if (diffDays === 1) dayLabel = "Mañana";
    else {
      dayLabel = date.toLocaleDateString("es-AR", { weekday: "long" });
      dayLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
    }

    const peakIdx = winds.indexOf(Math.max(...winds));
    return {
      date,
      dayLabel,
      hours,
      maxWind:  Math.max(...winds),
      avgWind:  Math.round(winds.reduce((a, b) => a + b, 0) / winds.length),
      peakHour: hours[peakIdx]?.time.getHours() ?? 12,
    };
  });
}

// ─── Ejemplo de integración con Open-Meteo (real, gratis) ─
// Descomentar en producción:
//
// export async function fetchRealForecast(): Promise<ForecastDay[]> {
//   const url =
//     "https://api.open-meteo.com/v1/forecast" +
//     "?latitude=45.68&longitude=10.73" +
//     "&hourly=windspeed_10m,winddirection_10m,windgusts_10m" +
//     "&wind_speed_unit=kn&timezone=Europe/Rome&forecast_days=7";
//
//   const res = await fetch(url);
//   const json = await res.json();
//
//   // json.hourly.time[] → strings ISO
//   // json.hourly.windspeed_10m[] → nudos
//   // json.hourly.winddirection_10m[] → grados
//   // Agrupar por día y mapear a ForecastDay[]
//   return parseForecast(json);
// }
