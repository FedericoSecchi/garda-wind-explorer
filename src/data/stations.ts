export interface WindStation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  windSpeed: number; // in knots
  windDirection: number; // in degrees
  temperature: number; // in Celsius
  humidity: number; // in percentage
  lastUpdate: string;
}

// Mock data for Lake Garda weather stations
export const mockStations: WindStation[] = [
  {
    id: "1",
    name: "Torbole Nord",
    lat: 45.8725,
    lng: 10.8755,
    windSpeed: 18,
    windDirection: 185,
    temperature: 22,
    humidity: 65,
    lastUpdate: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Riva del Garda",
    lat: 45.8860,
    lng: 10.8406,
    windSpeed: 22,
    windDirection: 190,
    temperature: 21,
    humidity: 70,
    lastUpdate: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Malcesine Centro",
    lat: 45.7640,
    lng: 10.8100,
    windSpeed: 12,
    windDirection: 170,
    temperature: 23,
    humidity: 60,
    lastUpdate: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Campione del Garda",
    lat: 45.7340,
    lng: 10.7550,
    windSpeed: 25,
    windDirection: 200,
    temperature: 24,
    humidity: 55,
    lastUpdate: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Limone sul Garda",
    lat: 45.8127,
    lng: 10.7920,
    windSpeed: 16,
    windDirection: 175,
    temperature: 22,
    humidity: 62,
    lastUpdate: new Date().toISOString(),
  },
  {
    id: "6",
    name: "Gargnano",
    lat: 45.6900,
    lng: 10.6650,
    windSpeed: 8,
    windDirection: 160,
    temperature: 25,
    humidity: 58,
    lastUpdate: new Date().toISOString(),
  },
  {
    id: "7",
    name: "Toscolano Maderno",
    lat: 45.6400,
    lng: 10.6100,
    windSpeed: 14,
    windDirection: 155,
    temperature: 24,
    humidity: 60,
    lastUpdate: new Date().toISOString(),
  },
  {
    id: "8",
    name: "Sirmione",
    lat: 45.4950,
    lng: 10.6070,
    windSpeed: 6,
    windDirection: 140,
    temperature: 26,
    humidity: 52,
    lastUpdate: new Date().toISOString(),
  },
  {
    id: "9",
    name: "Desenzano",
    lat: 45.4700,
    lng: 10.5400,
    windSpeed: 10,
    windDirection: 135,
    temperature: 25,
    humidity: 55,
    lastUpdate: new Date().toISOString(),
  },
  {
    id: "10",
    name: "Peschiera del Garda",
    lat: 45.4400,
    lng: 10.6900,
    windSpeed: 7,
    windDirection: 145,
    temperature: 26,
    humidity: 50,
    lastUpdate: new Date().toISOString(),
  },
];

export function getWindColor(speed: number): string {
  if (speed >= 20) return "hsl(0, 84%, 60%)"; // extreme - red
  if (speed >= 15) return "hsl(45, 93%, 55%)"; // high - yellow/orange
  if (speed >= 10) return "hsl(174, 72%, 46%)"; // medium - teal
  return "hsl(199, 70%, 50%)"; // low - blue
}

export function getWindLabel(speed: number): string {
  if (speed >= 20) return "Extremo";
  if (speed >= 15) return "Fuerte";
  if (speed >= 10) return "Moderado";
  return "Suave";
}

export function getDirectionName(degrees: number): string {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}
