import { WindStation, getWindLabel, getDirectionName, getWindColor } from "@/data/stations";
import { Wind, Compass, Thermometer, Droplets, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StationPanelProps {
  station: WindStation | null;
  onClose: () => void;
}

const StationPanel = ({ station, onClose }: StationPanelProps) => {
  if (!station) {
    return (
      <div className="bg-gradient-card rounded-xl border border-border p-6 shadow-card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Wind className="w-5 h-5 text-primary" />
          Detalles de la estación
        </h3>
        <p className="text-muted-foreground text-sm">
          Seleccioná un punto en el mapa para ver los datos de viento, temperatura y humedad.
        </p>
      </div>
    );
  }

  const windLabel = getWindLabel(station.windSpeed);
  const directionName = getDirectionName(station.windDirection);
  const windColor = getWindColor(station.windSpeed);

  return (
    <div className="bg-gradient-card rounded-xl border border-border p-6 shadow-card animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">{station.name}</h3>
          <span
            className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: windColor, color: "#0a2b41" }}
          >
            {windLabel}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-secondary/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Wind className="w-3.5 h-3.5" />
            Velocidad
          </div>
          <div className="text-2xl font-bold" style={{ color: windColor }}>
            {station.windSpeed} <span className="text-sm font-medium text-muted-foreground">nudos</span>
          </div>
        </div>

        <div className="bg-secondary/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Compass className="w-3.5 h-3.5" />
            Dirección
          </div>
          <div className="text-2xl font-bold">
            {directionName} <span className="text-sm font-medium text-muted-foreground">{station.windDirection}°</span>
          </div>
        </div>

        <div className="bg-secondary/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Thermometer className="w-3.5 h-3.5" />
            Temperatura
          </div>
          <div className="text-2xl font-bold">
            {station.temperature}° <span className="text-sm font-medium text-muted-foreground">C</span>
          </div>
        </div>

        <div className="bg-secondary/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
            <Droplets className="w-3.5 h-3.5" />
            Humedad
          </div>
          <div className="text-2xl font-bold">
            {station.humidity} <span className="text-sm font-medium text-muted-foreground">%</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="w-3.5 h-3.5" />
        Última actualización: {new Date(station.lastUpdate).toLocaleTimeString("es-AR")}
      </div>
    </div>
  );
};

export default StationPanel;
