# WindMap Garda

Herramienta para kiters y navegantes del Lago di Garda.

## Funcionalidades

- **Mapa** — Estaciones de viento con velocidad y dirección en tiempo real.
- **¿Navego?** — Motor de decisión: Ideal / Condiciones medias / No navegable según tu equipo.
- **Planificar** — Pronóstico 7 días. Marcás los días disponibles, el sistema recomienda cuándo vale.
- **Alertas** — "Ahora está ideal", "En 3 horas entra viento", "Mañana pinta bien".

## Stack

React 18 · TypeScript · Vite · Tailwind CSS · Mapbox GL · React Router

## Desarrollo

```bash
npm install
npm run dev
```

Para el mapa ingresá tu token de Mapbox (gratis en [mapbox.com](https://mapbox.com)).

## Datos reales

Los datos actuales son mock. Para datos reales descomentá `fetchRealForecast()` en `src/data/forecast.ts`:

```
Open-Meteo API (gratis, sin key):
https://api.open-meteo.com/v1/forecast?latitude=45.68&longitude=10.73
  &hourly=windspeed_10m,winddirection_10m,windgusts_10m
  &wind_speed_unit=kn&timezone=Europe/Rome&forecast_days=7
```
