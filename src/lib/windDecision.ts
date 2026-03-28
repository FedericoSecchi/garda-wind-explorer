export type SailingCondition = "no_navegable" | "condiciones_medias" | "ideal";

export interface UserProfile {
  weight: number;       // kg
  kiteSize: number;     // m²
  boardType: "twintip" | "directional" | "foil";
}

export interface DecisionInput {
  windSpeed: number;      // nudos
  windDirection: number;  // grados
  userProfile: UserProfile;
}

export interface DecisionOutput {
  condition: SailingCondition;
  label: string;
  explanation: string;
  suggestedKite: number;
  minWind: number;
  maxWind: number;
}

// Rango ideal de viento (nudos) por tamaño de kite
const KITE_WIND_TABLE: Record<number, [number, number]> = {
  7:  [22, 35],
  9:  [18, 28],
  10: [16, 25],
  12: [13, 22],
  14: [11, 19],
  15: [10, 17],
  17: [8,  15],
};

function getKiteRange(kiteSize: number): [number, number] {
  const sizes = Object.keys(KITE_WIND_TABLE).map(Number).sort((a, b) => a - b);
  const closest = sizes.reduce((prev, curr) =>
    Math.abs(curr - kiteSize) < Math.abs(prev - kiteSize) ? curr : prev
  );
  return KITE_WIND_TABLE[closest];
}

// Riders más pesados necesitan más viento. Baseline: 75 kg.
function weightAdjustment(weight: number): number {
  return Math.round((weight - 75) / 10 * 1.5);
}

export function evaluateConditions(input: DecisionInput): DecisionOutput {
  const { windSpeed, userProfile } = input;
  const { kiteSize, weight } = userProfile;

  const [baseMin, baseMax] = getKiteRange(kiteSize);
  const adj = weightAdjustment(weight);
  const minWind = baseMin + adj;
  const maxWind = baseMax + adj;
  const dangerThreshold = maxWind + 8;

  let condition: SailingCondition;
  let label: string;
  let explanation: string;

  if (windSpeed < minWind - 4) {
    condition = "no_navegable";
    label = "No navegable";
    explanation = `Viento insuficiente (${windSpeed} kn). Necesitás al menos ${minWind - 4} kn con tu ${kiteSize}m².`;
  } else if (windSpeed < minWind) {
    condition = "condiciones_medias";
    label = "Condiciones medias";
    explanation = `Viento marginal (${windSpeed} kn). Rango ideal para tu ${kiteSize}m²: ${minWind}–${maxWind} kn.`;
  } else if (windSpeed <= maxWind) {
    condition = "ideal";
    label = "Ideal";
    explanation = `Condiciones perfectas (${windSpeed} kn). Tu ${kiteSize}m² está en su rango ideal (${minWind}–${maxWind} kn).`;
  } else if (windSpeed <= dangerThreshold) {
    condition = "condiciones_medias";
    label = "Condiciones medias";
    explanation = `Viento fuerte (${windSpeed} kn). Tu ${kiteSize}m² puede ser grande. Considerá uno más pequeño.`;
  } else {
    condition = "no_navegable";
    label = "No navegable";
    explanation = `Viento demasiado fuerte (${windSpeed} kn). Máximo seguro con tu equipo: ~${dangerThreshold} kn.`;
  }

  return { condition, label, explanation, suggestedKite: getSuggestedKite(windSpeed, weight), minWind, maxWind };
}

// Kite óptimo para un viento y peso dado
export function getSuggestedKite(windSpeed: number, weight: number): number {
  if (windSpeed <= 0) return 17;
  const raw = (weight * 0.7) / windSpeed * 10;
  return Math.max(7, Math.min(17, Math.round(raw)));
}

// Rango ideal de viento (kn) para un perfil dado
export function getIdealRange(profile: UserProfile): [number, number] {
  const [baseMin, baseMax] = getKiteRange(profile.kiteSize);
  const adj = weightAdjustment(profile.weight);
  return [baseMin + adj, baseMax + adj];
}

export const CONDITION_CONFIG: Record<SailingCondition, {
  color: string;
  barColor: string;   // bg-* equivalente para barras/indicadores
  bg: string;
  border: string;
  icon: string;
}> = {
  ideal: {
    color: "text-emerald-400",
    barColor: "bg-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: "✓",
  },
  condiciones_medias: {
    color: "text-yellow-400",
    barColor: "bg-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    icon: "~",
  },
  no_navegable: {
    color: "text-red-400",
    barColor: "bg-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: "✗",
  },
};
