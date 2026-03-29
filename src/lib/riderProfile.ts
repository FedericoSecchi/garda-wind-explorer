// ─────────────────────────────────────────────────────────────
// Rider Wind Range
// Cleans up the scattered kite/weight helpers into one function.
// Used by hourlyEval and dayScore.
// ─────────────────────────────────────────────────────────────

export interface RiderWindRange {
  minUsable: number;   // below → too light to ride at all
  idealMin:  number;   // lower bound of sweet spot
  idealMax:  number;   // upper bound of sweet spot
  maxSafe:   number;   // above → overpowered / dangerous
}

export interface RiderProfile {
  weight:    number;   // kg
  kiteSize:  number;   // m²
  boardType: "twintip" | "directional" | "foil";
}

// Ideal kn range per kite size, baseline rider 75 kg
const KITE_TABLE: Record<number, [number, number]> = {
  7:  [22, 35],
  9:  [18, 28],
  10: [16, 25],
  12: [13, 22],
  14: [11, 19],
  15: [10, 17],
  17: [8,  15],
};

function closestKiteRange(size: number): [number, number] {
  const sizes = Object.keys(KITE_TABLE).map(Number).sort((a, b) => a - b);
  const best  = sizes.reduce((p, c) =>
    Math.abs(c - size) < Math.abs(p - size) ? c : p
  );
  return KITE_TABLE[best];
}

// Heavier riders need more wind. +1.5 kn per 10 kg above 75 kg.
function weightAdj(weight: number): number {
  return Math.round((weight - 75) / 10 * 1.5);
}

// Foil boards can fly in lighter wind (−3 kn threshold).
function boardAdj(boardType: RiderProfile["boardType"]): number {
  return boardType === "foil" ? -3 : 0;
}

export function getRiderWindRange(profile: RiderProfile): RiderWindRange {
  const [base_min, base_max] = closestKiteRange(profile.kiteSize);
  const adj = weightAdj(profile.weight) + boardAdj(profile.boardType);
  const idealMin = base_min + adj;
  const idealMax = base_max + adj;
  return {
    minUsable: idealMin - 4,
    idealMin,
    idealMax,
    maxSafe:   idealMax + 8,
  };
}

// Optimal kite size suggestion for a given wind speed and weight
export function suggestKiteSize(windSpeed: number, weight: number): number {
  if (windSpeed <= 0) return 17;
  const raw = (weight * 0.7) / windSpeed * 10;
  return Math.max(7, Math.min(17, Math.round(raw)));
}
