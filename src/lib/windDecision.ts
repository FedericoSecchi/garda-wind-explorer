// ============================================================
// MOTOR DE DECISIÓN - Reglas simples para kite/vela
// ============================================================
// Lógica: dado un viento actual + perfil del usuario,
// determina si las condiciones son aptas para navegar.
// NO usa ML. Solo rangos de viento por peso/kite.
// ============================================================

export type SailingCondition = "no_navegable" | "condiciones_medias" | "ideal";

export interface UserProfile {
  weight: number;       // kg
  kiteSize: number;     // m²  (e.g. 9, 12, 15, 17)
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
  suggestedKite: number;  // kite sugerido para el viento actual
  minWind: number;        // mínimo recomendado para el kite del usuario
  maxWind: number;        // máximo recomendado
}

// ─── Tabla de referencia por tamaño de kite ───────────────
// Cada kite tiene un rango ideal de viento (nudos).
// Ajustamos ±2 kn según el peso del rider.
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
  // Interpolación para tamaños no exactos en la tabla
  const sizes = Object.keys(KITE_WIND_TABLE).map(Number).sort((a, b) => a - b);
  const closest = sizes.reduce((prev, curr) =>
    Math.abs(curr - kiteSize) < Math.abs(prev - kiteSize) ? curr : prev
  );
  return KITE_WIND_TABLE[closest];
}

function weightAdjustment(weight: number): number {
  // Riders pesados necesitan más viento; livianos menos.
  // Baseline: 75 kg → sin ajuste. Por cada 10 kg: ±1.5 kn.
  return Math.round((weight - 75) / 10 * 1.5);
}

export function evaluateConditions(input: DecisionInput): DecisionOutput {
  const { windSpeed, userProfile } = input;
  const { kiteSize, weight } = userProfile;

  const [baseMin, baseMax] = getKiteRange(kiteSize);
  const adj = weightAdjustment(weight);
  const minWind = baseMin + adj;
  const maxWind = baseMax + adj;

  // Zona de peligro: viento muy por encima del máximo del kite
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
    explanation = `Viento marginal (${windSpeed} kn). El rango ideal para tu ${kiteSize}m² es ${minWind}–${maxWind} kn.`;
  } else if (windSpeed >= minWind && windSpeed <= maxWind) {
    condition = "ideal";
    label = "Ideal";
    explanation = `Condiciones perfectas (${windSpeed} kn). Tu ${kiteSize}m² está en su rango ideal (${minWind}–${maxWind} kn).`;
  } else if (windSpeed <= dangerThreshold) {
    condition = "condiciones_medias";
    label = "Condiciones medias";
    explanation = `Viento fuerte (${windSpeed} kn). Tu ${kiteSize}m² puede ser grande. Considera un kite más pequeño.`;
  } else {
    condition = "no_navegable";
    label = "No navegable";
    explanation = `Viento demasiado fuerte (${windSpeed} kn). No recomendado con tu equipo. Máximo seguro: ~${dangerThreshold} kn.`;
  }

  const suggestedKite = getSuggestedKite(windSpeed, weight);

  return { condition, label, explanation, suggestedKite, minWind, maxWind };
}

// ─── Kite sugerido para un viento dado ────────────────────
export function getSuggestedKite(windSpeed: number, weight: number): number {
  if (windSpeed <= 0) return 17;
  // Heurística simple: kiteArea ≈ (weight * 0.7) / windSpeed * 10
  const raw = (weight * 0.7) / windSpeed * 10;
  const rounded = Math.round(raw / 1) * 1;
  return Math.max(7, Math.min(17, rounded));
}

// ─── Colores por condición ─────────────────────────────────
export const CONDITION_CONFIG: Record<SailingCondition, {
  color: string;
  bg: string;
  border: string;
  icon: string;
}> = {
  ideal: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: "✓",
  },
  condiciones_medias: {
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    icon: "~",
  },
  no_navegable: {
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: "✗",
  },
};
