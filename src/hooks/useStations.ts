// Combina datos mock de estaciones con el viento real de Open-Meteo.
// Estrategia: usa el viento real en Torbole como baseline y escala
// el resto de estaciones proporcionalmente (preserva variación geográfica).

import { useMemo } from "react";
import { mockStations, WindStation } from "@/data/stations";
import { CurrentWind } from "@/hooks/useForecast";

const TORBOLE_IDX = 0; // mockStations[0] es Torbole Nord

export function useStations(currentWind: CurrentWind | null): WindStation[] {
  return useMemo(() => {
    if (!currentWind) return mockStations;

    const baseSpeed = mockStations[TORBOLE_IDX].windSpeed;
    const ratio     = baseSpeed > 0 ? currentWind.speed / baseSpeed : 1;

    return mockStations.map((station, i) => ({
      ...station,
      windSpeed:     Math.max(0, Math.round(station.windSpeed * ratio)),
      windDirection: i === TORBOLE_IDX ? currentWind.direction : station.windDirection,
      lastUpdate:    currentWind.updatedAt.toISOString(),
    }));
  }, [currentWind]);
}
