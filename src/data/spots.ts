// Base de datos de spots para kite y windsurf
// Añadir más spots: lat/lng de Google Maps, zoom 11-14 según el tamaño del spot

export interface Spot {
  id:           string;
  name:         string;       // Nombre del spot
  region:       string;       // "Andalucía, España"
  flag:         string;       // emoji bandera
  lat:          number;
  lng:          number;
  zoom:         number;       // zoom del mapa (11=amplio, 14=detalle)
  typicalWind:  string;       // descripción del viento local
  bestMonths:   string;       // temporada alta
  sport:        ("kite" | "windsurf" | "vela")[];
  hasAnemometer: boolean;     // si Open-Meteo tiene observaciones cercanas
  windguruId?:  number;       // ID en Windguru (para link externo)
}

export const SPOTS: Spot[] = [
  {
    id: "garda-torbole",
    name: "Torbole / Malcesine",
    region: "Lago di Garda, Italia",
    flag: "🇮🇹",
    lat: 45.8725, lng: 10.8755, zoom: 11,
    typicalWind: "Ora del Garda — térmica S→N 10–25 kn, mañanas",
    bestMonths: "May–Sep",
    sport: ["kite", "windsurf", "vela"],
    hasAnemometer: true,
    windguruId: 64948,
  },
  {
    id: "tarifa",
    name: "Tarifa",
    region: "Andalucía, España",
    flag: "🇪🇸",
    lat: 36.0140, lng: -5.6018, zoom: 12,
    typicalWind: "Levante / Poniente — 15–35 kn constante",
    bestMonths: "Jun–Sep",
    sport: ["kite", "windsurf"],
    hasAnemometer: true,
    windguruId: 48,
  },
  {
    id: "cabarete",
    name: "Cabarete",
    region: "República Dominicana",
    flag: "🇩🇴",
    lat: 19.7657, lng: -70.4094, zoom: 13,
    typicalWind: "Alisios NE — 15–25 kn tardes",
    bestMonths: "Ene–Ago",
    sport: ["kite", "windsurf"],
    hasAnemometer: false,
    windguruId: 642,
  },
  {
    id: "essaouira",
    name: "Essaouira",
    region: "Marruecos",
    flag: "🇲🇦",
    lat: 31.5085, lng: -9.7595, zoom: 12,
    typicalWind: "NNE alisios — 20–35 kn, muy constante",
    bestMonths: "May–Sep",
    sport: ["kite", "windsurf"],
    hasAnemometer: false,
    windguruId: 310,
  },
  {
    id: "dakhla",
    name: "Dakhla Lagoon",
    region: "Marruecos",
    flag: "🇲🇦",
    lat: 23.6848, lng: -15.9572, zoom: 12,
    typicalWind: "NNE constante — 20–30 kn, aguas planas",
    bestMonths: "Todo el año",
    sport: ["kite", "windsurf"],
    hasAnemometer: false,
    windguruId: 64942,
  },
  {
    id: "fuerteventura",
    name: "Fuerteventura (Sotavento)",
    region: "Islas Canarias, España",
    flag: "🇪🇸",
    lat: 28.1840, lng: -14.2182, zoom: 12,
    typicalWind: "Alisios NE — 15–25 kn estables",
    bestMonths: "Jun–Sep",
    sport: ["kite", "windsurf"],
    hasAnemometer: false,
    windguruId: 347,
  },
  {
    id: "capetown",
    name: "Bloubergstrand",
    region: "Ciudad del Cabo, Sudáfrica",
    flag: "🇿🇦",
    lat: -33.8014, lng: 18.4651, zoom: 12,
    typicalWind: "Cape Doctor SE — 20–40 kn fuerte",
    bestMonths: "Nov–Mar",
    sport: ["kite", "windsurf"],
    hasAnemometer: false,
    windguruId: 3960,
  },
  {
    id: "hood-river",
    name: "Hood River",
    region: "Oregon, EE.UU.",
    flag: "🇺🇸",
    lat: 45.7054, lng: -121.5224, zoom: 12,
    typicalWind: "Viento de garganta W — 15–30 kn",
    bestMonths: "Jun–Sep",
    sport: ["kite", "windsurf"],
    hasAnemometer: false,
  },
  {
    id: "jericoacoara",
    name: "Jericoacoara",
    region: "Ceará, Brasil",
    flag: "🇧🇷",
    lat: -2.7977, lng: -40.5136, zoom: 13,
    typicalWind: "E/SE constante — 15–25 kn",
    bestMonths: "Jul–Ene",
    sport: ["kite", "windsurf"],
    hasAnemometer: false,
  },
  {
    id: "paracas",
    name: "Paracas",
    region: "Ica, Perú",
    flag: "🇵🇪",
    lat: -13.8338, lng: -76.2491, zoom: 12,
    typicalWind: "SE Paracas — 15–30 kn tardes",
    bestMonths: "Dic–Mar",
    sport: ["kite", "windsurf"],
    hasAnemometer: false,
  },
  {
    id: "boracay",
    name: "Bulabog Beach",
    region: "Boracay, Filipinas",
    flag: "🇵🇭",
    lat: 11.9627, lng: 121.9318, zoom: 14,
    typicalWind: "Amihan NE — 15–25 kn",
    bestMonths: "Nov–May",
    sport: ["kite", "windsurf"],
    hasAnemometer: false,
  },
  {
    id: "mui-ne",
    name: "Mũi Né",
    region: "Bình Thuận, Vietnam",
    flag: "🇻🇳",
    lat: 10.9328, lng: 108.2889, zoom: 13,
    typicalWind: "NE monsoon — 15–25 kn",
    bestMonths: "Nov–Mar",
    sport: ["kite", "windsurf"],
    hasAnemometer: false,
  },
];

// Spot por defecto
export const DEFAULT_SPOT = SPOTS[0];
