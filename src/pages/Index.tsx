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
import { mockStations, WindStation } from "@/data/stations";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Map, Compass, CalendarDays, Bell } from "lucide-react";

type Tab = "mapa" | "decidir" | "planificar" | "alertas";

const TABS: { id: Tab; label: string; icon: typeof Map }[] = [
  { id: "mapa",       label: "Mapa",       icon: Map          },
  { id: "decidir",    label: "¿Navego?",   icon: Compass      },
  { id: "planificar", label: "Planificar", icon: CalendarDays },
  { id: "alertas",    label: "Alertas",    icon: Bell         },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("decidir");
  const [selectedStation, setSelectedStation] = useState<WindStation | null>(null);
  const [minWind, setMinWind] = useState(0);
  const { profile, setProfile } = useUserProfile();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-ocean">
      <Header />

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
                stations={mockStations}
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
                    <span className="font-semibold">{mockStations.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Viento máximo</span>
                    <span className="font-semibold text-wind-extreme">
                      {Math.max(...mockStations.map((s) => s.windSpeed))} kn
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Promedio</span>
                    <span className="font-semibold text-primary">
                      {Math.round(
                        mockStations.reduce((acc, s) => acc + s.windSpeed, 0) / mockStations.length
                      )}{" "}
                      kn
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Spots con +15 kn</span>
                    <span className="font-semibold text-accent">
                      {mockStations.filter((s) => s.windSpeed >= 15).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            TAB: ¿NAVEGO? (motor de decisión)
        ════════════════════════════════════════════════ */}
        {activeTab === "decidir" && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h2 className="text-xl font-bold">¿Navego hoy?</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Decisión basada en el viento actual + tu equipo. Reglas simples, sin ML.
              </p>
            </div>
            <DecisionWidget profile={profile} onProfileChange={setProfile} />
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
                Pronóstico 7 días. Marcá los días que podés salir y te digo cuándo vale.
              </p>
            </div>
            <Planner profile={profile} />
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
            <AlertFeed profile={profile} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
