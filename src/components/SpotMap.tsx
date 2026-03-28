// Mapa del spot con Leaflet + OpenStreetMap (gratis, sin token)
// Solo muestra datos reales: pin del spot + condiciones actuales de la API.
// No muestra estaciones sintéticas ni datos inventados.

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Spot } from "@/data/spots";
import { CurrentWind } from "@/hooks/useForecast";
import { getDirectionName } from "@/data/stations";

// Fix Leaflet default icon en Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface SpotMapProps {
  spot:        Spot;
  currentWind: CurrentWind | null;
}

// Icono del spot (emoji de bandera)
function spotIcon(flag: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="font-size:26px;line-height:1;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.6))">${flag}</div>`,
    iconSize:   [32, 32],
    iconAnchor: [16, 16],
  });
}

// Icono circular con velocidad + flecha de dirección (solo con datos reales)
function windIcon(speed: number, direction: number): L.DivIcon {
  const hue   = speed >= 25 ? 0 : speed >= 15 ? 45 : speed >= 10 ? 174 : 199;
  const color = `hsl(${hue}, 80%, 55%)`;
  const arrow = `
    <div style="
      position:absolute;top:50%;left:50%;
      transform:translate(-50%,-50%) rotate(${direction}deg) translateY(-22px);
      width:0;height:0;
      border-left:4px solid transparent;
      border-right:4px solid transparent;
      border-bottom:9px solid ${color};
    "></div>`;

  return L.divIcon({
    className: "",
    html: `
      <div style="
        position:relative;width:40px;height:40px;
        border-radius:50%;background:${color};
        border:3px solid rgba(255,255,255,0.9);
        box-shadow:0 2px 10px rgba(0,0,0,0.5);
        display:flex;align-items:center;justify-content:center;
        font-weight:800;font-size:11px;color:#071a2b;
      ">
        ${speed}
        ${arrow}
      </div>`,
    iconSize:   [40, 40],
    iconAnchor: [20, 20],
  });
}

// Mueve y hace zoom al cambiar el spot
function MapMover({ spot }: { spot: Spot }) {
  const map = useMap();
  useEffect(() => {
    map.setView([spot.lat, spot.lng], spot.zoom, { animate: true, duration: 1 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot.id]);
  return null;
}

export default function SpotMap({ spot, currentWind }: SpotMapProps) {
  return (
    <div className="rounded-xl overflow-hidden border border-border shadow-card" style={{ height: "60vh" }}>
      <MapContainer
        center={[spot.lat, spot.lng]}
        zoom={spot.zoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
          maxZoom={18}
        />

        <MapMover spot={spot} />

        {/* Pin principal del spot */}
        <Marker position={[spot.lat, spot.lng]} icon={spotIcon(spot.flag)}>
          <Popup>
            <div style={{ minWidth: 180 }}>
              <div className="font-bold text-sm mb-1">{spot.flag} {spot.name}</div>
              <div className="text-xs text-gray-500 mb-2">{spot.region}</div>
              <div className="text-xs mb-1">🌬 {spot.typicalWind}</div>
              <div className="text-xs text-gray-400">Mejor temporada: {spot.bestMonths}</div>
              {currentWind && (
                <div className="mt-2 pt-2 border-t border-gray-200 text-xs">
                  <span className="font-semibold text-emerald-600">Ahora: </span>
                  {currentWind.speed} kn
                  {currentWind.gust > 0 && ` · ráf. ${currentWind.gust} kn`}
                  {" · "}{getDirectionName(currentWind.direction)} ({currentWind.direction}°)
                </div>
              )}
            </div>
          </Popup>
        </Marker>

        {/* Marcador de viento real (solo si hay datos de la API) */}
        {currentWind && (
          <Marker
            position={[spot.lat, spot.lng]}
            icon={windIcon(currentWind.speed, currentWind.direction)}
          >
            <Popup>
              <div style={{ minWidth: 160 }}>
                <div className="font-semibold text-sm mb-1">Condiciones actuales</div>
                <div className="text-xs space-y-0.5">
                  <div>💨 <b>{currentWind.speed} kn</b> — {getDirectionName(currentWind.direction)} ({currentWind.direction}°)</div>
                  {currentWind.gust > 0 && <div>⚡ Ráfagas: <b>{currentWind.gust} kn</b></div>}
                  <div className="text-gray-400 mt-1">
                    Fuente: Open-Meteo GFS · {currentWind.updatedAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
