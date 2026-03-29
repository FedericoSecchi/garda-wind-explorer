// ─────────────────────────────────────────────────────────────
// Spot Rules — intelligence layer per spot
// Encodes direction sectors, behaviors, and gust character.
// ─────────────────────────────────────────────────────────────

export type DirQuality = "ideal" | "valid" | "bad" | "dangerous";

// A compass sector: clockwise from `from` to `to` (0-359).
// dangerous = true means this direction is unsafe regardless of speed
// (e.g. direct offshore wind where the rider cannot return to shore).
export interface DirSector {
  from:      number;
  to:        number;
  label:     string;
  quality:   DirQuality;
  dangerous?: boolean;
}

export type WaterType = "flat" | "chop" | "waves";
export type GustChar  = "stable" | "moderate" | "gusty";

export interface SpotRules {
  spotId:       string;
  sectors:      DirSector[];  // all defined sectors; unlisted dirs → quality "valid" by default
  defaultQuality: DirQuality; // quality for directions NOT listed in sectors
  waterType:    WaterType;
  gustChar:     GustChar;
  notes:        string;
}

// ── Direction helpers ─────────────────────────────────────────

// Returns true if `deg` falls within the clockwise arc [from, to].
export function inSector(deg: number, from: number, to: number): boolean {
  const d = ((deg % 360) + 360) % 360;
  const f = ((from % 360) + 360) % 360;
  const t = ((to % 360)   + 360) % 360;
  if (f <= t) return d >= f && d <= t;
  return d >= f || d <= t;   // wraps around 0/360
}

// Evaluate a direction against a spot's sectors.
// Returns the sector matched (or undefined for default).
export function evalDirection(
  dir: number,
  rules: SpotRules
): { quality: DirQuality; label: string; dangerous: boolean } {
  for (const s of rules.sectors) {
    if (inSector(dir, s.from, s.to)) {
      return {
        quality:   s.quality,
        label:     s.label,
        dangerous: s.dangerous ?? false,
      };
    }
  }
  return {
    quality:   rules.defaultQuality,
    label:     "Variable",
    dangerous: false,
  };
}

// ── Quality → numeric score ───────────────────────────────────
export const DIR_SCORE: Record<DirQuality, number> = {
  ideal:     100,
  valid:      60,
  bad:        15,
  dangerous:   0,
};

// ── Spot definitions ──────────────────────────────────────────
const SPOT_RULES: Record<string, SpotRules> = {

  // ── ITALIA ───────────────────────────────────────────────────
  "garda-torbole": {
    spotId: "garda-torbole",
    sectors: [
      { from: 150, to: 210, label: "Ora (S)",  quality: "ideal"                 },
      { from: 340, to: 20,  label: "Pelèr (N)", quality: "valid"                 },
      { from: 60,  to: 120, label: "E — sombra de viento", quality: "bad"        },
      { from: 230, to: 310, label: "W — sombra de monte",  quality: "bad"        },
    ],
    defaultQuality: "valid",
    waterType: "chop",
    gustChar:  "stable",
    notes: "Ora = térmica S de tarde (estable). Pelèr = N de madrugada. Lago protegido.",
  },

  // ── ESPAÑA ───────────────────────────────────────────────────
  "tarifa": {
    spotId: "tarifa",
    sectors: [
      { from: 60,  to: 120, label: "Levante (E)",  quality: "ideal"                        },
      { from: 250, to: 300, label: "Poniente (W)",  quality: "ideal"                        },
      { from: 120, to: 200, label: "SE-S — inestable", quality: "bad"                       },
      { from: 310, to: 40,  label: "N-NE — sin canalización", quality: "valid"              },
    ],
    defaultQuality: "valid",
    waterType: "waves",
    gustChar:  "moderate",
    notes: "Levante y Poniente son los vientos canónicos del Estrecho. Levante: más constante. Poniente: a veces gustoso.",
  },

  // ── CARIBE / PACÍFICO ─────────────────────────────────────────
  "cabarete": {
    spotId: "cabarete",
    sectors: [
      { from: 20,  to: 75,  label: "Alisios NE",        quality: "ideal"                    },
      { from: 75,  to: 110, label: "E — válido",         quality: "valid"                    },
      { from: 200, to: 280, label: "S-SW — offshore",    quality: "dangerous", dangerous: true },
      { from: 280, to: 350, label: "W-NW — offshore",    quality: "dangerous", dangerous: true },
    ],
    defaultQuality: "valid",
    waterType: "waves",
    gustChar:  "stable",
    notes: "Trade NE = clásico. Offshore al sur/oeste = peligroso. Laguna protegida del reef.",
  },

  // ── MARRUECOS ─────────────────────────────────────────────────
  "essaouira": {
    spotId: "essaouira",
    sectors: [
      { from: 330, to: 40,  label: "NNE — Alisios",    quality: "ideal"                    },
      { from: 40,  to: 80,  label: "NE — válido",       quality: "valid"                    },
      { from: 150, to: 270, label: "S-SW — leve/malo",  quality: "bad"                      },
    ],
    defaultQuality: "valid",
    waterType: "waves",
    gustChar:  "stable",
    notes: "Alisios NNE muy constantes Jun-Sep. Viento va a lo largo de la costa (side-shore).",
  },

  "dakhla": {
    spotId: "dakhla",
    sectors: [
      { from: 340, to: 30,  label: "NNE — laguna plana",  quality: "ideal"                  },
      { from: 30,  to: 70,  label: "NE — válido",          quality: "valid"                  },
      { from: 160, to: 280, label: "S-W — offshore laguna", quality: "dangerous", dangerous: true },
    ],
    defaultQuality: "valid",
    waterType: "flat",
    gustChar:  "stable",
    notes: "Laguna aguas planas. NNE es lado-shore ideal. Offshore del lado opuesto = peligroso.",
  },

  // ── ISLAS CANARIAS ────────────────────────────────────────────
  "fuerteventura": {
    spotId: "fuerteventura",
    sectors: [
      { from: 30,  to: 80,  label: "NE — Alisios",      quality: "ideal"                    },
      { from: 80,  to: 110, label: "ENE — válido",       quality: "valid"                    },
      { from: 200, to: 300, label: "SW-W — offshore",    quality: "dangerous", dangerous: true },
    ],
    defaultQuality: "valid",
    waterType: "chop",
    gustChar:  "stable",
    notes: "Alisios NE muy consistentes. Aguas de chop moderado.",
  },

  // ── SUDÁFRICA ─────────────────────────────────────────────────
  "capetown": {
    spotId: "capetown",
    sectors: [
      { from: 120, to: 170, label: "SE — Cape Doctor",    quality: "ideal"                   },
      { from: 170, to: 210, label: "S — válido",           quality: "valid"                   },
      { from: 290, to: 350, label: "NW-N — offshore PELIGROSO", quality: "dangerous", dangerous: true },
      { from: 30,  to: 100, label: "NE-E — leve/malo",    quality: "bad"                     },
    ],
    defaultQuality: "valid",
    waterType: "waves",
    gustChar:  "gusty",
    notes: "Cape Doctor SE = 20-40 kn, muy gusty. NW = offshore peligroso. Agua fría.",
  },

  // ── EE.UU. ───────────────────────────────────────────────────
  "hood-river": {
    spotId: "hood-river",
    sectors: [
      { from: 250, to: 300, label: "W — Columbia Gorge",  quality: "ideal"                   },
      { from: 230, to: 250, label: "WSW — válido",         quality: "valid"                   },
      { from: 80,  to: 160, label: "E-SE — Coho (débil)",  quality: "bad"                     },
    ],
    defaultQuality: "valid",
    waterType: "chop",
    gustChar:  "moderate",
    notes: "Garganta del Columbia canaliza viento W. Muy consistente jun-sep.",
  },

  // ── BRASIL ───────────────────────────────────────────────────
  "jericoacoara": {
    spotId: "jericoacoara",
    sectors: [
      { from: 70,  to: 120, label: "E-ESE — Alisios",    quality: "ideal"                    },
      { from: 40,  to: 70,  label: "NE-E — válido",       quality: "valid"                    },
      { from: 120, to: 160, label: "ESE-SE — válido",     quality: "valid"                    },
      { from: 220, to: 310, label: "SW-W — offshore",     quality: "dangerous", dangerous: true },
    ],
    defaultQuality: "valid",
    waterType: "chop",
    gustChar:  "stable",
    notes: "Alisios E muy constantes. Spot mundo renombrado. Offshore al O = peligroso.",
  },

  // ── PERÚ ─────────────────────────────────────────────────────
  "paracas": {
    spotId: "paracas",
    sectors: [
      { from: 125, to: 170, label: "SE-SSE — Paracas",   quality: "ideal"                    },
      { from: 170, to: 210, label: "S — válido",          quality: "valid"                    },
      { from: 300, to: 40,  label: "N-NE — sin viento",   quality: "bad"                      },
    ],
    defaultQuality: "valid",
    waterType: "chop",
    gustChar:  "moderate",
    notes: "Viento Paracas SE baja del desierto. Muy fuerte tardes. Amplificado por térmica.",
  },

  // ── FILIPINAS ────────────────────────────────────────────────
  "boracay": {
    spotId: "boracay",
    sectors: [
      { from: 20,  to: 75,  label: "NE — Amihan",         quality: "ideal"                   },
      { from: 75,  to: 110, label: "E — válido",           quality: "valid"                   },
      { from: 200, to: 300, label: "SW-W — Habagat",       quality: "dangerous", dangerous: true },
    ],
    defaultQuality: "valid",
    waterType: "flat",
    gustChar:  "stable",
    notes: "Amihan NE = temporada perfecta (Nov-May). Habagat SW = cerrado (Jun-Oct).",
  },

  // ── VIETNAM ──────────────────────────────────────────────────
  "mui-ne": {
    spotId: "mui-ne",
    sectors: [
      { from: 25,  to: 75,  label: "NE — Monzón",         quality: "ideal"                   },
      { from: 75,  to: 105, label: "ENE — válido",         quality: "valid"                   },
      { from: 200, to: 310, label: "SW-NW — offshore",     quality: "dangerous", dangerous: true },
    ],
    defaultQuality: "valid",
    waterType: "waves",
    gustChar:  "stable",
    notes: "Monzón NE muy consistente Nov-Mar. Costa al E/SE.",
  },

  // ── ARGENTINA ────────────────────────────────────────────────
  "dique-los-molinos": {
    spotId: "dique-los-molinos",
    sectors: [
      { from: 155, to: 215, label: "S-SSW — Térmica",    quality: "ideal"                    },
      { from: 215, to: 260, label: "SW — válido",          quality: "valid"                    },
      { from: 240, to: 300, label: "W-NW — Zonda",        quality: "valid"                    },
      { from: 300, to: 360, label: "NW-N — gusty/frío",   quality: "bad"                      },
      { from: 0,   to: 60,  label: "N-NE — sombra terreno", quality: "bad"                    },
    ],
    defaultQuality: "valid",
    waterType: "chop",
    gustChar:  "moderate",
    notes: "Térmica S de tarde (14-19h), muy predecible. Zonda W-NW puede ser muy fuerte y gusty.",
  },

  "cuesta-del-viento": {
    spotId: "cuesta-del-viento",
    sectors: [
      { from: 235, to: 285, label: "WSW-W — Zonda",      quality: "ideal"                    },
      { from: 210, to: 235, label: "SW — válido",          quality: "valid"                    },
      { from: 285, to: 330, label: "WNW-NW — más racheado", quality: "valid"                  },
      { from: 330, to: 90,  label: "N-E — sombra",         quality: "bad"                     },
      { from: 90,  to: 180, label: "E-S — sin viento",     quality: "bad"                     },
    ],
    defaultQuality: "valid",
    waterType: "flat",
    gustChar:  "moderate",
    notes: "Embalse de montaña. Zonda WSW canalizado en el valle. Aguas planas. Muy predecible de tarde.",
  },

  "rio-de-la-plata": {
    spotId: "rio-de-la-plata",
    sectors: [
      { from: 30,  to: 80,  label: "NE — Sudestada",     quality: "ideal"                     },
      { from: 200, to: 260, label: "SW — Pampero",        quality: "valid"                     },
      { from: 310, to: 30,  label: "N-NW — húmedo/leve",  quality: "bad"                       },
      { from: 80,  to: 150, label: "E-SE — onshore fuerte", quality: "valid"                   },
    ],
    defaultQuality: "valid",
    waterType: "chop",
    gustChar:  "gusty",
    notes: "Pampero SW = viento frío post-frente, muy gusty. Sudestada NE = más estable. Río ancho.",
  },
};

// ── Public API ────────────────────────────────────────────────

export function getSpotRules(spotId: string): SpotRules | null {
  return SPOT_RULES[spotId] ?? null;
}

// Human-readable direction name (16-point compass)
export function directionName(deg: number): string {
  const names = ["N","NNE","NE","ENE","E","ESE","SE","SSE",
                 "S","SSW","SW","WSW","W","WNW","NW","NNW"];
  const idx = Math.round(((deg % 360) + 360) % 360 / 22.5) % 16;
  return names[idx];
}
