import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { WindStation, getWindColor } from "@/data/stations";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

interface WindMapProps {
  stations: WindStation[];
  onStationSelect: (station: WindStation | null) => void;
  selectedStation: WindStation | null;
  minWind: number;
}

const WindMap = ({ stations, onStationSelect, selectedStation, minWind }: WindMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [token, setToken] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);

  const filteredStations = stations.filter((s) => s.windSpeed >= minWind);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !token || map.current) return;

    mapboxgl.accessToken = token;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [10.73, 45.68], // Lake Garda center
        zoom: 10,
        pitch: 30,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      map.current.on("load", () => {
        setMapLoaded(true);
      });
    } catch (error) {
      console.error("Error initializing map:", error);
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [token]);

  // Update markers when stations or filter changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    filteredStations.forEach((station) => {
      const el = document.createElement("div");
      el.className = "wind-marker";
      el.style.cssText = `
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: ${getWindColor(station.windSpeed)};
        border: 3px solid rgba(255,255,255,0.9);
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 11px;
        color: #0a2b41;
        transition: transform 0.2s, box-shadow 0.2s;
      `;
      el.innerHTML = `${station.windSpeed}`;
      el.title = station.name;

      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.2)";
        el.style.boxShadow = "0 6px 20px rgba(0,0,0,0.5)";
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "scale(1)";
        el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.4)";
      });
      el.addEventListener("click", () => {
        onStationSelect(station);
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([station.lng, station.lat])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [filteredStations, mapLoaded, onStationSelect]);

  // Fly to selected station
  useEffect(() => {
    if (!map.current || !selectedStation) return;
    map.current.flyTo({
      center: [selectedStation.lng, selectedStation.lat],
      zoom: 12,
      duration: 1000,
    });
  }, [selectedStation]);

  if (!token) {
    return (
      <div className="h-[60vh] md:h-[70vh] rounded-xl bg-card border border-border flex flex-col items-center justify-center p-6 gap-4">
        <div className="p-4 rounded-full bg-primary/10">
          <MapPin className="w-10 h-10 text-primary" />
        </div>
        <div className="text-center max-w-md">
          <h3 className="text-lg font-semibold mb-2">Configurar Mapbox</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Ingresá tu token público de Mapbox para visualizar el mapa. Podés obtenerlo en{" "}
            <a
              href="https://mapbox.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              mapbox.com
            </a>
          </p>
          <Input
            type="text"
            placeholder="pk.eyJ1..."
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="bg-secondary border-border"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[60vh] md:h-[70vh] rounded-xl overflow-hidden shadow-card">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute inset-0 pointer-events-none rounded-xl ring-1 ring-inset ring-border" />
    </div>
  );
};

export default WindMap;
