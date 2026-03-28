import { useState } from "react";
import { Spot, SPOTS, DEFAULT_SPOT } from "@/data/spots";

const STORAGE_KEY = "windmap_spot_id";

export function useSpot() {
  const [spot, setSpotState] = useState<Spot>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEY);
      return SPOTS.find((s) => s.id === savedId) ?? DEFAULT_SPOT;
    } catch {
      return DEFAULT_SPOT;
    }
  });

  function setSpot(s: Spot) {
    setSpotState(s);
    try { localStorage.setItem(STORAGE_KEY, s.id); } catch { /* noop */ }
  }

  return { spot, setSpot };
}
