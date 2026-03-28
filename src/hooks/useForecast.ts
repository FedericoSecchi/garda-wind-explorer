// ============================================================
// PRONÓSTICO MULTI-MODELO — Open-Meteo API (gratis, sin key)
// ============================================================
// Fetches 3 modelos en paralelo para cada spot:
//   GFS/NOAA    → el mismo modelo que usa Windguru por defecto
//   ECMWF IFS   → el mismo que usa Windy en su tier premium
//   ICON (DWD)  → modelo alemán, alta resolución Europa / global
//
// Si un modelo falla → se marca available:false, los demás siguen.
// Si todos fallan    → error claro, SIN datos inventados.
// ============================================================

import { useState, useEffect } from "react";
import { ForecastDay, parseOpenMeteoForecast } from "@/data/forecast";
import { Spot } from "@/data/spots";

export interface CurrentWind {
  speed:     number;
  direction: number;
  gust:      number;
  updatedAt: Date;
}

export interface ModelForecast {
  key:        "gfs" | "ecmwf" | "icon";
  label:      string;
  sublabel:   string;
  forecast:   ForecastDay[];
  available:  boolean;
}

export interface WindData {
  models:      ModelForecast[];
  currentWind: CurrentWind | null;
  isReal:      boolean;
  loading:     boolean;
  error:       string | null;
  spotId:      string;
}

// ─── Configuración de modelos ─────────────────────────────
export const MODELS: { key: ModelForecast["key"]; label: string; sublabel: string; param: string }[] = [
  { key: "gfs",   label: "GFS / NOAA",  sublabel: "≈ Windguru",         param: "gfs_seamless"    },
  { key: "ecmwf", label: "ECMWF IFS",   sublabel: "≈ Windy premium",    param: "ecmwf_ifs025"    },
  { key: "icon",  label: "ICON (DWD)",  sublabel: "Modelo global DWD",  param: "icon_seamless"   },
];

function buildUrl(lat: number, lng: number, model: string, includeCurrent: boolean): string {
  const base =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
    "&hourly=windspeed_10m,winddirection_10m,windgusts_10m" +
    "&wind_speed_unit=kn" +
    "&timezone=auto" +
    "&forecast_days=7" +
    `&models=${model}`;
  return includeCurrent
    ? base + "&current=windspeed_10m,winddirection_10m,windgusts_10m"
    : base;
}

// URL pública legible para verificación (sin current, sin timezone verbose)
export function buildVerifyUrl(lat: number, lng: number, model: string): string {
  return (
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
    "&hourly=windspeed_10m,winddirection_10m,windgusts_10m" +
    "&wind_speed_unit=kn&timezone=auto&forecast_days=7" +
    `&models=${model}`
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseCurrentWind(json: any): CurrentWind | null {
  if (!json.current) return null;
  const s = Math.round(json.current.windspeed_10m     ?? 0);
  const d = Math.round(json.current.winddirection_10m ?? 0);
  const g = Math.round(json.current.windgusts_10m     ?? 0);
  if (s === 0 && d === 0) return null;
  return { speed: s, direction: d, gust: g, updatedAt: new Date() };
}

const EMPTY_STATE = (spotId: string): WindData => ({
  models:      MODELS.map((m) => ({ key: m.key, label: m.label, sublabel: m.sublabel, forecast: [], available: false })),
  currentWind: null,
  isReal:      false,
  loading:     true,
  error:       null,
  spotId,
});

export function useForecast(spot: Spot): WindData {
  const [state, setState] = useState<WindData>(() => EMPTY_STATE(spot.id));

  useEffect(() => {
    let cancelled = false;
    setState(EMPTY_STATE(spot.id));

    async function fetchAll() {
      const results = await Promise.allSettled(
        MODELS.map(async (m, idx) => {
          const url = buildUrl(spot.lat, spot.lng, m.param, idx === 0);
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status} (${m.key})`);
          const json = await res.json();
          if (json.error) throw new Error(json.reason ?? `API error (${m.key})`);
          const forecast = parseOpenMeteoForecast(json);
          if (forecast.length === 0) throw new Error(`Sin datos para ${m.key}`);
          return { forecast, json };
        })
      );

      if (cancelled) return;

      let currentWind: CurrentWind | null = null;
      let anySuccess = false;

      const models: ModelForecast[] = MODELS.map((m, idx) => {
        const result = results[idx];
        if (result.status === "fulfilled") {
          anySuccess = true;
          if (idx === 0) currentWind = parseCurrentWind(result.value.json);
          return { key: m.key, label: m.label, sublabel: m.sublabel, forecast: result.value.forecast, available: true };
        } else {
          console.warn(`[useForecast] ${m.key} falló:`, result.reason?.message);
          return { key: m.key, label: m.label, sublabel: m.sublabel, forecast: [], available: false };
        }
      });

      setState({
        models,
        currentWind,
        isReal:  anySuccess,
        loading: false,
        error:   anySuccess ? null : "No se pudo obtener el pronóstico. Verificá tu conexión.",
        spotId:  spot.id,
      });
    }

    fetchAll().catch((err) => {
      if (!cancelled) {
        setState((prev) => ({ ...prev, loading: false, isReal: false, error: String(err) }));
      }
    });

    return () => { cancelled = true; };
  }, [spot.id, spot.lat, spot.lng]);

  return state;
}

// Primer modelo disponible. Devuelve [] si ninguno tiene datos.
export function getPrimaryForecast(data: WindData): ForecastDay[] {
  return data.models.find((m) => m.available)?.forecast ?? [];
}
