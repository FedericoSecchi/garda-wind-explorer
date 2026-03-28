// ============================================================
// HOOK: datos reales de viento desde Open-Meteo
// ============================================================
// API gratuita, sin API key, límite: 10.000 calls/día.
// Coordenadas: Torbole (norte del lago, el spot más activo).
// ============================================================

import { useState, useEffect } from "react";
import { ForecastDay, parseOpenMeteoForecast, mockForecast } from "@/data/forecast";

const BASE_LAT = 45.8725;
const BASE_LNG = 10.8755; // Torbole Nord

const API_URL =
  "https://api.open-meteo.com/v1/forecast" +
  `?latitude=${BASE_LAT}&longitude=${BASE_LNG}` +
  "&hourly=windspeed_10m,winddirection_10m,windgusts_10m" +
  "&current=windspeed_10m,winddirection_10m,windgusts_10m" +
  "&wind_speed_unit=kn&timezone=Europe%2FRome&forecast_days=7";

export interface CurrentWind {
  speed:     number;   // nudos
  direction: number;   // grados
  gust:      number;   // nudos
  updatedAt: Date;
}

export interface WindData {
  forecast:     ForecastDay[];
  currentWind:  CurrentWind | null;
  isReal:       boolean;   // true = datos de API, false = mock
  loading:      boolean;
  error:        string | null;
}

export function useForecast(): WindData {
  const [state, setState] = useState<WindData>({
    forecast:    mockForecast,
    currentWind: null,
    isReal:      false,
    loading:     true,
    error:       null,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;

        const forecast = parseOpenMeteoForecast(json);

        let currentWind: CurrentWind | null = null;
        if (json.current) {
          currentWind = {
            speed:     Math.round(json.current.windspeed_10m     ?? 0),
            direction: Math.round(json.current.winddirection_10m ?? 0),
            gust:      Math.round(json.current.windgusts_10m     ?? 0),
            updatedAt: new Date(),
          };
        }

        setState({ forecast, currentWind, isReal: true, loading: false, error: null });
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Error desconocido";
        console.warn("[useForecast] Usando datos mock:", msg);
        setState((prev) => ({ ...prev, loading: false, error: msg }));
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  return state;
}
