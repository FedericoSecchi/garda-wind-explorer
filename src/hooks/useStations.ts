// Escala los datos de estaciones mock al viento real del spot seleccionado.
// Si no hay viento real, devuelve las estaciones mock sin cambios.

import { useMemo } from "react";
import { mockStations, WindStation } from "@/data/stations";
import { CurrentWind } from "@/hooks/useForecast";
import { Spot } from "@/data/spots";

export function useStations(spot: Spot, currentWind: CurrentWind | null): WindStation[] {
  return useMemo(() => {
    // Centrar las estaciones en el spot seleccionado
    const offsetLat = spot.lat - mockStations[0].lat;
    const offsetLng = spot.lng - mockStations[0].lng;

    if (!currentWind) {
      // Sin datos reales: devolver estaciones recentradas, viento inalterado
      return mockStations.map((s) => ({
        ...s,
        lat: s.lat + offsetLat,
        lng: s.lng + offsetLng,
      }));
    }

    const baseSpeed = mockStations[0].windSpeed;
    const ratio     = baseSpeed > 0 ? currentWind.speed / baseSpeed : 1;

    return mockStations.map((s, i) => ({
      ...s,
      lat:          s.lat + offsetLat,
      lng:          s.lng + offsetLng,
      windSpeed:    Math.max(0, Math.round(s.windSpeed * ratio)),
      windDirection: i === 0 ? currentWind.direction : s.windDirection,
      lastUpdate:   currentWind.updatedAt.toISOString(),
    }));
  }, [spot.id, currentWind]);
}
