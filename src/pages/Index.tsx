import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SpotSelector from "@/components/SpotSelector";
import SpotMap from "@/components/SpotMap";
import StationPanel from "@/components/StationPanel";
import WindFilter from "@/components/WindFilter";
import WindLegend from "@/components/WindLegend";
import DecisionWidget from "@/components/DecisionWidget";
import ModelComparison from "@/components/ModelComparison";
import Planner from "@/components/Planner";
import AlertFeed from "@/components/AlertFeed";
import { WindStation } from "@/data/stations";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useSpot } from "@/hooks/useSpot";
import { useForecast, getPrimaryForecast } from "@/hooks/useForecast";
import { useStations } from "@/hooks/useStations";
import { Map, Compass, CalendarDays, Bell, Wifi, WifiOff, Loader } from "lucide-react";

type Tab = "mapa" | "decidir" | "planificar" | "alertas";

const TABS: { id: Tab; label: string; icon: typeof Map }[] = [
  { id: "mapa",       label: "Mapa",       icon: Map          },
  { id: "decidir",    label: "¿Navego?",   icon: Compass      },
  { id: "planificar", label: "Planificar", icon: CalendarDays },
  { id: "alertas",    label: "Alertas",    icon: Bell         },
];

const Index = () => {
  const [activeTab, setActiveTab]             = useState<Tab>("decidir");
  const [selectedStation, setSelectedStation] = useState<WindStation | null>(null);
  const [minWind, setMinWind]                 = useState(0);

  const { profile, setProfile } = useUserProfile();
  const { spot, setSpot }       = useSpot();
  const windData                = useForecast(spot);
  const stations                = useStations(spot, windData.currentWind);
  const primaryForecast         = getPrimaryForecast(windData);
  const todayForecast           = primaryForecast[0] ?? null;

  // Reset station selection when spot changes
  const handleSpotChange = (newSpot: typeof spot) => {
    setSpot(newSpot);
    setSelectedStation(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-ocean">
      <Header />

      {/* ── Selector de spot (global) ─────────────────── */}
      <div className="border-b border-border bg-card/30 px-4 py-3">
        <div className="container mx-auto max-w-2xl">
          <SpotSelector spot={spot} onSelect={handleSpotChange} />
        </div>
      </div>

      {/* ── Barra de estado de datos ───────────────────── */}
      <div className="bg-secondary/20 border-b border-border/50 px-4 py-1.5">
        <div className="container mx-auto flex items-center gap-2 text-xs text-muted-foreground">
          {windData.loading ? (
            <>
              <Loader className="w-3 h-3 animate-spin" />
              <span>Consultando modelos meteorológicos…</span>
            </>
          ) : windData.isReal ? (
            <>
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Datos reales</span>
              <span>· GFS · ECMWF · ICON via Open-Meteo</span>
              {windData.currentWind && (
                <span className="ml-auto tabular-nums">
                  Ahora: {windData.currentWind.speed} kn
                  {windData.currentWind.gust > 0 && ` · ráf. ${windData.currentWind.gust} kn`}
                </span>
              )}
            </>
          ) : windData.error ? (
            <>
              <WifiOff className="w-3 h-3 text-yellow-400" />
              <span className="text-yellow-400 font-medium">Sin datos reales</span>
              <span>· mostrando estimación</span>
            </>
          ) : null}
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────── */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`
                  flex items-center gap-1.5 px-4 py-3 text-sm font-medium
                  border-b-2 transition-colors whitespace-nowrap
                  ${activeTab === id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"}
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-6 md:py-8">

        {/* ════════════════════════════════════════════════
            TAB: MAPA
        ════════════════════════════════════════════════ */}
        {activeTab === "mapa" && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold">{spot.flag} {spot.name}</h2>
                  <p className="text-muted-foreground text-sm mt-0.5">{spot.typicalWind}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>{spot.bestMonths}</div>
                  <div>{spot.sport.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" · ")}</div>
                </div>
              </div>

              <SpotMap
                spot={spot}
                stations={stations}
                minWind={minWind}
              />
              <WindLegend />
            </div>

            <div className="space-y-4">
              <WindFilter value={minWind} onChange={setMinWind} />
              <StationPanel
                station={selectedStation}
                onClose={() => setSelectedStation(null)}
              />
              <div className="bg-gradient-card rounded-xl border border-border p-5 shadow-card">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  Resumen del spot
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Estaciones", value: String(stations.length) },
                    { label: "Viento máximo", value: `${Math.max(...stations.map((s) => s.windSpeed))} kn`, color: "text-wind-extreme" },
                    { label: "Promedio", value: `${Math.round(stations.reduce((a, s) => a + s.windSpeed, 0) / stations.length)} kn`, color: "text-primary" },
                    { label: "Spots +15 kn", value: String(stations.filter((s) => s.windSpeed >= 15).length), color: "text-accent" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">{label}</span>
                      <span className={`font-semibold ${color ?? ""}`}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Info del spot */}
                <div className="mt-4 pt-4 border-t border-border space-y-1 text-xs text-muted-foreground">
                  <div>📍 {spot.lat.toFixed(4)}°, {spot.lng.toFixed(4)}°</div>
                  {spot.hasAnemometer && <div>🌊 Observaciones meteorológicas disponibles</div>}
                  {spot.windguruId && (
                    <a
                      href={`https://www.windguru.cz/${spot.windguruId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline block"
                    >
                      Ver en Windguru ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: ¿NAVEGO?
        ════════════════════════════════════════════════ */}
        {activeTab === "decidir" && (
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Spot info inline */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{spot.flag}</span>
              <span className="font-medium text-foreground">{spot.name}</span>
              <span>·</span>
              <span>{spot.typicalWind}</span>
            </div>

            {/* Perfil arriba + resultado principal */}
            <DecisionWidget
              profile={profile}
              onProfileChange={setProfile}
              stations={stations}
              todayForecast={todayForecast}
              loading={windData.loading}
            />

            {/* Comparación de modelos */}
            <ModelComparison
              models={windData.models}
              profile={profile}
              loading={windData.loading}
            />
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: PLANIFICADOR
        ════════════════════════════════════════════════ */}
        {activeTab === "planificar" && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div>
              <h2 className="text-xl font-bold">Planificador — {spot.flag} {spot.name}</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Pronóstico {windData.isReal ? "real (GFS·ECMWF·ICON)" : "estimado"} · 7 días.
                Marcá los días que podés salir.
              </p>
            </div>
            <Planner profile={profile} forecast={primaryForecast} />
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: ALERTAS
        ════════════════════════════════════════════════ */}
        {activeTab === "alertas" && (
          <div className="max-w-2xl mx-auto space-y-4">
            <div>
              <h2 className="text-xl font-bold">Alertas — {spot.flag} {spot.name}</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Notificaciones basadas en tu perfil y el pronóstico del spot.
              </p>
            </div>
            <AlertFeed profile={profile} forecast={primaryForecast} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
