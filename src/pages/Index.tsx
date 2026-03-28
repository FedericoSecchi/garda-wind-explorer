import { useState } from "react";
import Header from "@/components/Header";
import WindMap from "@/components/WindMap";
import StationPanel from "@/components/StationPanel";
import WindFilter from "@/components/WindFilter";
import WindLegend from "@/components/WindLegend";
import Footer from "@/components/Footer";
import DecisionWidget from "@/components/DecisionWidget";
import Planner from "@/components/Planner";
import AlertFeed from "@/components/AlertFeed";
import { WindStation } from "@/data/stations";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useForecast } from "@/hooks/useForecast";
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
  const [activeTab, setActiveTab]           = useState<Tab>("decidir");
  const [selectedStation, setSelectedStation] = useState<WindStation | null>(null);
  const [minWind, setMinWind]               = useState(0);

  const { profile, setProfile } = useUserProfile();
  const { forecast, currentWind, isReal, loading } = useForecast();
  const stations = useStations(currentWind);

  const todayForecast = forecast[0] ?? null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-ocean">
      <Header />

      {/* ── Barra de estado de datos ───────────────────── */}
      <div className="bg-secondary/30 border-b border-border px-4 py-1.5">
        <div className="container mx-auto flex items-center gap-2 text-xs text-muted-foreground">
          {loading ? (
            <>
              <Loader className="w-3 h-3 animate-spin" />
              <span>Cargando datos de viento…</span>
            </>
          ) : isReal ? (
            <>
              <Wifi className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Datos reales</span>
              <span>· Open-Meteo · Torbole</span>
              {currentWind && (
                <span className="ml-auto">
                  Ahora: {currentWind.speed} kn · {currentWind.direction}° · ráfagas {currentWind.gust} kn
                </span>
              )}
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-yellow-400" />
              <span className="text-yellow-400 font-medium">Datos de ejemplo</span>
              <span>· API no disponible</span>
            </>
          )}
        </div>
      </div>

      {/* ── Tabs de navegación ─────────────────────────── */}
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
              <div>
                <h2 className="text-xl font-bold">Mapa en tiempo real</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Marcadores muestran velocidad en nudos. Color indica intensidad.
                </p>
              </div>
              <WindMap
                stations={stations}
                onStationSelect={setSelectedStation}
                selectedStation={selectedStation}
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
              <div className="bg-gradient-card rounded-xl border border-border p-6 shadow-card">
                <h3 className="text-lg font-semibold mb-4">Resumen del lago</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Estaciones activas</span>
                    <span className="font-semibold">{stations.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Viento máximo</span>
                    <span className="font-semibold text-wind-extreme">
                      {Math.max(...stations.map((s) => s.windSpeed))} kn
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Promedio</span>
                    <span className="font-semibold text-primary">
                      {Math.round(stations.reduce((acc, s) => acc + s.windSpeed, 0) / stations.length)} kn
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Spots con +15 kn</span>
                    <span className="font-semibold text-accent">
                      {stations.filter((s) => s.windSpeed >= 15).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: ¿NAVEGO?
        ════════════════════════════════════════════════ */}
        {activeTab === "decidir" && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h2 className="text-xl font-bold">¿Navego hoy?</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Decisión basada en viento {isReal ? "real" : "estimado"} + tu equipo.
              </p>
            </div>
            <DecisionWidget
              profile={profile}
              onProfileChange={setProfile}
              stations={stations}
              todayForecast={todayForecast}
            />
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: PLANIFICADOR
        ════════════════════════════════════════════════ */}
        {activeTab === "planificar" && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h2 className="text-xl font-bold">Planificador semanal</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Pronóstico {isReal ? "real" : "estimado"} 7 días. Marcá los días disponibles.
              </p>
            </div>
            <Planner profile={profile} forecast={forecast} />
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: ALERTAS
        ════════════════════════════════════════════════ */}
        {activeTab === "alertas" && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h2 className="text-xl font-bold">Alertas de viento</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Notificaciones basadas en tu perfil y el pronóstico de 7 días.
              </p>
            </div>
            <AlertFeed profile={profile} forecast={forecast} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
