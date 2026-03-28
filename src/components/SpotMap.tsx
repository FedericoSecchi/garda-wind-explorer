// Mapa del spot con Leaflet + OpenStreetMap (gratis, sin token)
// Muestra: ubicación del spot, estaciones de viento, dirección del viento

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Spot } from "@/data/spots";
import { WindStation, getWindColor, getDirectionName } from "@/data/stations";

// Fix Leaflet default icon en Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface SpotMapProps {
  spot:     Spot;
  stations: WindStation[];
  minWind:  number;
}

// Icono circular con velocidad del viento
function windIcon(speed: number, direction: number): L.DivIcon {
  const color = getWindColor(speed);
  const arrow = `
    <div style="
      position:absolute;top:50%;left:50%;
      transform:translate(-50%,-50%) rotate(${direction}deg) translateY(-22px);
      width:0;height:0;
      border-left:4px solid transparent;
      border-right:4px solid transparent;
      border-bottom:8px solid ${color};
    "></div>`;

  return L.divIcon({
    className: "",
    html: `
      <div style="
        position:relative;width:38px;height:38px;
        border-radius:50%;background:${color};
        border:3px solid rgba(255,255,255,0.9);
        box-shadow:0 2px 8px rgba(0,0,0,0.4);
        display:flex;align-items:center;justify-content:center;
        font-weight:700;font-size:11px;color:#0a2b41;
        cursor:pointer;
      ">
        ${speed}
        ${arrow}
      </div>`,
    iconSize:   [38, 38],
    iconAnchor: [19, 19],
  });
}

// Icono especial para el spot principal
function spotIcon(flag: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="font-size:24px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">${flag}</div>`,
    iconSize:   [30, 30],
    iconAnchor: [15, 15],
  });
}

// Componente interno para mover el mapa cuando cambia el spot
function MapMover({ spot }: { spot: Spot }) {
  const map = useMap();
  useEffect(() => {
    map.setView([spot.lat, spot.lng], spot.zoom, { animate: true, duration: 1 });
  }, [spot.id]);
  return null;
}

export default function SpotMap({ spot, stations, minWind }: SpotMapProps) {
  const filtered = stations.filter((s) => s.windSpeed >= minWind);

  return (
    <div className="rounded-xl overflow-hidden border border-border shadow-card" style={{ height: "60vh" }}>
      <MapContainer
        center={[spot.lat, spot.lng]}
        zoom={spot.zoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
      >
        {/* Tiles de OpenStreetMap */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
          maxZoom={18}
        />

        {/* Mover mapa al cambiar spot */}
        <MapMover spot={spot} />

        {/* Pin del spot */}
        <Marker position={[spot.lat, spot.lng]} icon={spotIcon(spot.flag)}>
          <Popup>
            <div className="text-sm font-semibold">{spot.flag} {spot.name}</div>
            <div className="text-xs text-gray-500">{spot.typicalWind}</div>
          </Popup>
        </Marker>

        {/* Estaciones de viento */}
        {filtered.map((station) => (
          <Marker
            key={station.id}
            position={[station.lat, station.lng]}
            icon={windIcon(station.windSpeed, station.windDirection)}
          >
            <Popup>
              <div style={{ minWidth: 160 }}>
                <div className="font-semibold text-sm mb-1">{station.name}</div>
                <div className="text-xs space-y-0.5">
                  <div>💨 <b>{station.windSpeed} kn</b> — {getDirectionName(station.windDirection)} ({station.windDirection}°)</div>
                  <div>🌡 {station.temperature}°C</div>
                  <div>💧 {station.humidity}%</div>
                  <div className="text-gray-400 mt-1">
                    {new Date(station.lastUpdate).toLocaleTimeString("es-AR")}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
