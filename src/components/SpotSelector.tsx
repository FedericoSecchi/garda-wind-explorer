import { useState, useRef, useEffect } from "react";
import { ChevronDown, MapPin, Wind } from "lucide-react";
import { Spot, SPOTS } from "@/data/spots";

interface SpotSelectorProps {
  spot:     Spot;
  onSelect: (spot: Spot) => void;
}

export default function SpotSelector({ spot, onSelect }: SpotSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function select(s: Spot) {
    onSelect(s);
    setOpen(false);
  }

  // Agrupar por deporte para el dropdown
  const kiteSpots     = SPOTS.filter((s) => s.sport.includes("kite"));
  const surfOnlySpots = SPOTS.filter((s) => !s.sport.includes("kite"));

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-secondary/50 hover:bg-secondary border border-border rounded-xl px-4 py-2.5 transition-colors w-full"
      >
        <MapPin className="w-4 h-4 text-primary shrink-0" />
        <div className="flex-1 text-left min-w-0">
          <div className="font-semibold text-sm leading-tight truncate">
            {spot.flag} {spot.name}
          </div>
          <div className="text-xs text-muted-foreground truncate">{spot.region}</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
          <div className="p-1">
            {kiteSpots.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  Kite / Windsurf
                </div>
                {kiteSpots.map((s) => (
                  <SpotOption key={s.id} spot={s} selected={s.id === spot.id} onSelect={select} />
                ))}
              </>
            )}
            {surfOnlySpots.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-xs text-muted-foreground uppercase tracking-wider font-medium mt-1">
                  Vela
                </div>
                {surfOnlySpots.map((s) => (
                  <SpotOption key={s.id} spot={s} selected={s.id === spot.id} onSelect={select} />
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SpotOption({ spot, selected, onSelect }: { spot: Spot; selected: boolean; onSelect: (s: Spot) => void }) {
  return (
    <button
      onClick={() => onSelect(spot)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
        selected ? "bg-primary/15 text-primary" : "hover:bg-secondary/60"
      }`}
    >
      <span className="text-lg leading-none">{spot.flag}</span>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate ${selected ? "text-primary" : ""}`}>
          {spot.name}
        </div>
        <div className="text-xs text-muted-foreground truncate">{spot.region}</div>
      </div>
      <div className="shrink-0 text-right">
        <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
          <Wind className="w-3 h-3" />
          <span className="hidden sm:inline">{spot.bestMonths}</span>
        </div>
      </div>
    </button>
  );
}
