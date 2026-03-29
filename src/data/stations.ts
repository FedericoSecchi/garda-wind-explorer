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
