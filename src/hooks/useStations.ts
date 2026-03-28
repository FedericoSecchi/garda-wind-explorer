// Genera marcadores de viento posicionados alrededor del spot.
// Los nombres reflejan el spot actual (no son nombres de Garda).
// Los valores de velocidad se escalan al viento real de la API.

import { useMemo } from "react";
import { WindStation } from "@/data/stations";
import { CurrentWind } from "@/hooks/useForecast";
import { Spot } from "@/data/spots";

// Offsets relativos al centro del spot (lat/lng) y etiquetas direccionales
const ZONE_DEFS: { dlat: number; dlng: number; dir: string }[] = [
  { dlat:  0.000, dlng:  0.000, dir: "Centro"   },
  { dlat:  0.022, dlng:  0.000, dir: "Norte"     },
  { dlat: -0.022, dlng:  0.000, dir: "Sur"       },
  { dlat:  0.000, dlng:  0.032, dir: "Este"      },
  { dlat:  0.000, dlng: -0.032, dir: "Oeste"     },
  { dlat:  0.015, dlng:  0.020, dir: "Noreste"   },
  { dlat: -0.015, dlng: -0.020, dir: "Suroeste"  },
];

// Variación espacial de viento relativa al centro (realista pero sintética)
const SPEED_RATIOS     = [1.0, 1.15, 0.85, 1.05, 0.90, 1.10, 0.80];
const DIR_OFFSETS      = [0,   5,   -5,    8,   -8,    3,    -3];  // ° respecto al viento central

export function useStations(spot: Spot, currentWind: CurrentWind | null): WindStation[] {
  return useMemo(() => {
    const baseSpeed = currentWind?.speed     ?? 12;
    const baseDir   = currentWind?.direction ?? 180;
    const updatedAt = currentWind?.updatedAt ?? new Date();

    return ZONE_DEFS.map((zone, i) => ({
      id:           String(i + 1),
      name:         `${spot.name} · ${zone.dir}`,
      lat:          spot.lat + zone.dlat,
      lng:          spot.lng + zone.dlng,
      windSpeed:    Math.max(0, Math.round(baseSpeed * SPEED_RATIOS[i])),
      windDirection: (baseDir + DIR_OFFSETS[i] + 360) % 360,
      temperature:  20,   // placeholder — no relevante para la decisión
      humidity:     65,
      lastUpdate:   updatedAt.toISOString(),
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot.id, currentWind]);
}
